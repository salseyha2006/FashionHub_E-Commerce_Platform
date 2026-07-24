// backend/prisma/seed.js
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  const adminEmail = 'admin@Thida Shop.com';
  const adminPassword = 'Admin@12345';
  const adminHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Admin',
      email: adminEmail,
      passwordHash: adminHash,
      role: 'admin',
    },
  });

  const categoriesData = [
    { name: 'Dresses', slug: 'dresses' },
    { name: 'Tops', slug: 'tops' },
    { name: 'Bottoms', slug: 'bottoms' },
  ];

  const categories = {};
  for (const c of categoriesData) {
    categories[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  const products = [
    {
      name: 'Linen Wrap Dress',
      categorySlug: 'dresses',
      description: 'A breathable linen wrap dress, perfect for warm days.',
      price: 45.0,
      images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
      variants: [
        { size: 'S', color: 'Beige', stockQuantity: 8 },
        { size: 'M', color: 'Beige', stockQuantity: 10 },
        { size: 'L', color: 'Beige', stockQuantity: 5 },
      ],
    },
    {
      name: 'Cotton Blouse',
      categorySlug: 'tops',
      description: 'Classic cotton blouse with a relaxed fit.',
      price: 28.5,
      images: ['https://images.unsplash.com/photo-1564257631407-3deb25e91d34?w=800'],
      variants: [
        { size: 'S', color: 'White', stockQuantity: 12 },
        { size: 'M', color: 'White', stockQuantity: 15 },
        { size: 'M', color: 'Black', stockQuantity: 6 },
      ],
    },
    {
      name: 'Tailored Trousers',
      categorySlug: 'bottoms',
      description: 'Slim-fit tailored trousers for a polished look.',
      price: 39.0,
      images: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800'],
      variants: [
        { size: 'M', color: 'Navy', stockQuantity: 7 },
        { size: 'L', color: 'Navy', stockQuantity: 4 },
      ],
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) continue;
    await prisma.product.create({
      data: {
        name: p.name,
        categoryId: categories[p.categorySlug].id,
        description: p.description,
        price: p.price,
        images: p.images,
        variants: { create: p.variants },
      },
    });
  }

  console.log('✅ Seed complete');
  console.log(`Admin login → email: ${adminEmail} / password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });