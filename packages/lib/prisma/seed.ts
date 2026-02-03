import { db } from './prisma-client';

async function main() {
  console.log('Starting seed...');

  // Add your seed data here
  // Example:
  // const user = await db.user.create({
  //   data: {
  //     email: 'test@example.com',
  //     name: 'Test User',
  //   },
  // });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
