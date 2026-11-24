import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  // eslint-disable-next-line no-var
  var __prismaInstance: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prismaInstance ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__prismaInstance = prisma;
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
