import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

/**
 * Get Prisma client with custom session context
 * Useful for setting RLS variables or other session-level config
 */
export async function getPrismaWithContext(context: Record<string, string>) {
  const contextString = JSON.stringify(context);

  await db.$executeRawUnsafe(`
    SET LOCAL request.jwt.claims = '${contextString}';
  `);

  return db;
}
