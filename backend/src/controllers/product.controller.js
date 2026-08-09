// src/controllers/product.controller.js
const prisma = require('../config/db');
const { validateProductInput } = require('../utils/validators');
const { toProductListItem, toProductDetail } = require('../utils/serializers');
const { slugify } = require('../utils/slugify');
const { attachSkusToVariants } = require('../utils/sku');

const SORT_OPTIONS = {
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
  newest: { createdAt: 'desc' },
};

async function getProducts(req, res) {
  try {
    const {
      category,
      size,
      color,
      minPrice,
      maxPrice,
      search,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);

    const where = { isActive: true };

    if (category) {
      where.category = { slug: category };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined && !isNaN(minPrice)) where.price.gte = Number(minPrice);
      if (maxPrice !== undefined && !isNaN(maxPrice)) where.price.lte = Number(maxPrice);
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (size || color) {
      where.variants = {
        some: {
          ...(size ? { size } : {}),
          ...(color ? { color: { equals: color, mode: 'insensitive' } } : {}),
        },
      };
    }

    const orderBy = SORT_OPTIONS[sort] || { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: { select: { stockQuantity: true } },
        },
        orderBy,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        products: products.map(toProductListItem),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (err) {
    console.error('Get products error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, variants: true },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, data: toProductDetail(product) });
  } catch (err) {
    console.error('Get product error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
}

async function createProduct(req, res) {
  try {
    const { name, categoryId, description, price, images, variants } = req.body;

    const errors = validateProductInput({ name, categoryId, price, variants });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(400).json({ success: false, message: 'Invalid categoryId' });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        categoryId,
        description: description || null,
        price,
        images: images || [],
        variants: {
          create: await attachSkusToVariants(name, variants),
        },
      },
      include: { category: true, variants: true },
    });

    return res.status(201).json({ success: true, data: toProductDetail(product) });
  } catch (err) {
    if (err.code === 'P2002' && err.meta?.target?.includes('sku')) {
      return res.status(400).json({ success: false, message: 'That SKU is already used by another variant.' });
    }
    console.error('Create product error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create product' });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, categoryId, description, price, images, variants, isActive } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const errors = validateProductInput({ name, categoryId, price, variants });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        return res.status(400).json({ success: false, message: 'Invalid categoryId' });
      }
    }

    // Match incoming variants against existing ones by size+color so we can
    // UPDATE what's unchanged/edited and CREATE what's new, instead of
    // deleting everything. Only variants the admin actually removed are
    // deleted — and only if they have no order history attached.
    const keyOf = (v) => `${v.size}`.trim().toLowerCase() + '::' + `${v.color}`.trim().toLowerCase();

    const existingByKey = new Map(existing.variants.map((v) => [keyOf(v), v]));
    const incomingKeys = new Set(variants.map(keyOf));

    const toRemove = existing.variants.filter((v) => !incomingKeys.has(keyOf(v)));

    if (toRemove.length > 0) {
      const orderCount = await prisma.orderItem.count({
        where: { variantId: { in: toRemove.map((v) => v.id) } },
      });
      if (orderCount > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Some variants you removed have existing orders and can't be deleted. Add them back, or deactivate the product instead if it's discontinued.",
        });
      }
    }

    const skuFilledVariants = await attachSkusToVariants(name, variants);

    const product = await prisma.$transaction(async (tx) => {
      if (toRemove.length > 0) {
        await tx.productVariant.deleteMany({ where: { id: { in: toRemove.map((v) => v.id) } } });
      }

      for (let i = 0; i < variants.length; i++) {
        const incoming = variants[i];
        const match = existingByKey.get(keyOf(incoming));
        const skuValue = skuFilledVariants[i].sku;

        if (match) {
          await tx.productVariant.update({
            where: { id: match.id },
            data: {
              size: incoming.size,
              color: incoming.color,
              stockQuantity: incoming.stockQuantity,
              sku: skuValue,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: id,
              size: incoming.size,
              color: incoming.color,
              stockQuantity: incoming.stockQuantity,
              sku: skuValue,
            },
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: {
          name: name.trim(),
          categoryId,
          description: description || null,
          price,
          images: images || [],
          isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
        },
        include: { category: true, variants: true },
      });
    });

    return res.status(200).json({ success: true, data: toProductDetail(product) });
  } catch (err) {
    if (err.code === 'P2002' && err.meta?.target?.includes('sku')) {
      return res.status(400).json({ success: false, message: 'That SKU is already used by another variant.' });
    }
    console.error('Update product error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update product' });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { variants: { select: { id: true } } },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variantIds = existing.variants.map((v) => v.id);
    const orderCount = variantIds.length
      ? await prisma.orderItem.count({ where: { variantId: { in: variantIds } } })
      : 0;

    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "This product has existing orders and can't be deleted. Set it to inactive instead to remove it from the shop while keeping order history.",
      });
    }

    await prisma.product.delete({ where: { id } });

    return res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error('Delete product error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
}

// Finds a category by name (case-insensitive). If not found and
// autoCreate is true, creates it (reusing the same slugify + sortOrder
// logic as category.controller.js). Returns null if not found and
// autoCreate is false.
async function resolveCategoryByName(name, autoCreate) {
  const trimmed = (name || '').trim();
  if (!trimmed) return null;

  const existing = await prisma.category.findFirst({
    where: { name: { equals: trimmed, mode: 'insensitive' } },
  });
  if (existing) return existing;

  if (!autoCreate) return null;

  const slug = slugify(trimmed);

  // A category with this slug might already exist under a differently-cased
  // name that our case-insensitive name match above didn't catch (e.g. slug
  // collision from punctuation differences) — reuse it instead of erroring.
  const bySlug = await prisma.category.findUnique({ where: { slug } });
  if (bySlug) return bySlug;

  const maxOrder = await prisma.category.aggregate({ _max: { sortOrder: true } });
  return prisma.category.create({
    data: { name: trimmed, slug, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
  });
}

// Bulk product import. Each row is processed independently inside its own
// try/catch so one bad row can never abort the rest of the batch. Reuses
// validateProductInput (name/price/variants) — categoryId is resolved from
// the row's category name first since the client sends a name, not an id.
async function bulkImportProducts(req, res) {
  try {
    const { rows, autoCreateCategories } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows to import' });
    }

    let created = 0;
    const skipped = [];

    for (const row of rows) {
      const rowNumber = row?._row ?? '?';
      try {
        const { name, category, description, price, images, variants } = row || {};

        const categoryRecord = await resolveCategoryByName(category, !!autoCreateCategories);
        if (!categoryRecord) {
          skipped.push({ row: rowNumber, reason: `Category "${category || ''}" not found` });
          continue;
        }

        const errors = validateProductInput({ name, categoryId: categoryRecord.id, price, variants });
        if (errors.length > 0) {
          skipped.push({ row: rowNumber, reason: errors[0] });
          continue;
        }

        await prisma.product.create({
          data: {
            name: name.trim(),
            categoryId: categoryRecord.id,
            description: description || null,
            price,
            images: Array.isArray(images) ? images : [],
            variants: {
              create: await attachSkusToVariants(name, variants),
            },
          },
        });
        created++;
      } catch (rowErr) {
        console.error(`Bulk import row ${rowNumber} error:`, rowErr);
        skipped.push({ row: rowNumber, reason: 'Unexpected error while creating this product' });
      }
    }

    return res.status(200).json({ success: true, data: { created, skipped } });
  } catch (err) {
    console.error('Bulk import error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process bulk import' });
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
};