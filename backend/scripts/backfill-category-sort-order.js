// backend/scripts/backfill-category-sort-order.js
// One-time backfill: assigns sequential sortOrder (0, 1, 2, ...) to every
// existing category, preserving their current alphabetical order. Needed
// because the schema migration only set sortOrder=0 on every pre-existing
// row — swapping two categories that are both 0 is a no-op, which is why
// the ↑/↓ reorder buttons appeared broken for categories created before
// this feature shipped. Run this ONCE, right after the migration.
const prisma = require('../src/config/db');

async function main() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  for (let i = 0; i < categories.length; i++) {
    await prisma.category.update({
      where: { id: categories[i].id },
      data: { sortOrder: i },
    });
  }

  console.log(`Backfilled sortOrder for ${categories.length} categories.`);
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());