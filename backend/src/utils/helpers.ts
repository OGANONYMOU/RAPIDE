import { v4 as uuid } from 'uuid';

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RPD-${timestamp}-${random}`;
};

export const formatCurrency = (amount: number, currency = 'XOF'): string => {
  return new Intl.NumberFormat('fr-BJ', { style: 'currency', currency }).format(amount);
};

export const slugify = (text: string): string => {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
};

export const paginateMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});
