// src/controllers/category.controller.js
const prisma = require('../config/db');
const { validateCategoryInput } = require('../utils/validators');
const { slugify } = require('../utils/slugify');

async function getCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        _count: { select: { products: true } },
      },
    });

    const data = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      sortOrder: c.sortOrder,
      productCount: c._count.products,
    }));

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Get categories error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
}

async function createCategory(req, res) {
  try {
    const { name } = req.body;

    const errors = validateCategoryInput({ name });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const slug = slugify(name);

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A category with this name already exists' });
    }

    const maxOrder = await prisma.category.aggregate({ _max: { sortOrder: true } });

    const category = await prisma.category.create({
      data: { name: name.trim(), slug, sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 },
    });

    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    console.error('Create category error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create category' });
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const errors = validateCategoryInput({ name });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const slug = slugify(name);

    const slugConflict = await prisma.category.findFirst({
      where: { slug, NOT: { id } },
    });
    if (slugConflict) {
      return res.status(409).json({ success: false, message: 'A category with this name already exists' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim(), slug },
    });

    return res.status(200).json({ success: true, data: category });
  } catch (err) {
    console.error('Update category error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update category' });
  }
}

async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing products',
      });
    }

    await prisma.category.delete({ where: { id } });

    return res.status(200).json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error('Delete category error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
}

// Swaps sortOrder with the adjacent category in the given direction ('up' | 'down')
async function reorderCategory(req, res) {
  try {
    const { id } = req.params;
    const { direction } = req.body;

    const all = await prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    const index = all.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Category not found' });

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= all.length) {
      return res.status(200).json({ success: true, data: all });
    }

    const current = all[index];
    const swapWith = all[swapIndex];

    await prisma.$transaction([
      prisma.category.update({ where: { id: current.id }, data: { sortOrder: swapWith.sortOrder } }),
      prisma.category.update({ where: { id: swapWith.id }, data: { sortOrder: current.sortOrder } }),
    ]);

    const updated = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true, sortOrder: true, _count: { select: { products: true } } },
    });

    return res.status(200).json({
      success: true,
      data: updated.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        sortOrder: c.sortOrder,
        productCount: c._count.products,
      })),
    });
  } catch (err) {
    console.error('Reorder category error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reorder category' });
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory, reorderCategory };