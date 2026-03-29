import './env';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

type PrismaEventClient = PrismaClient & {
  $on(event: 'error' | 'warn', callback: (event: unknown) => void): void;
};

const prismaEventClient = prisma as PrismaEventClient;

prismaEventClient.$on('error', (e) => {
  logger.error('Prisma error:', e);
});

prismaEventClient.$on('warn', (e) => {
  logger.warn('Prisma warning:', e);
});
