import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number, currency = 'XOF') =>
  new Intl.NumberFormat('fr-BJ', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

export const formatDate = (date: string | Date, locale = 'fr-BJ') =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

export const formatDateShort = (date: string | Date, locale = 'fr-BJ') =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(date));

export const getAssetUrl = (path?: string | null) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/uploads/')) return path;

  const assetOrigin = process.env.NEXT_PUBLIC_API_URL || '';
  return `${assetOrigin}${path}`;
};

export const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    DELIVERED:             'bg-success-light text-success-dark',
    CANCELLED:             'bg-danger-light text-danger-dark',
    DISPUTED:              'bg-danger-light text-danger-dark',
    IN_TRANSIT:            'bg-info-light text-info-dark',
    PICKED_UP:             'bg-info-light text-info-dark',
    DRIVER_EN_ROUTE_PICKUP:'bg-info-light text-info-dark',
    DRIVER_ASSIGNED:       'bg-primary-100 text-primary-700',
    SEARCHING_DRIVER:      'bg-primary-100 text-primary-700',
    PENDING_PAYMENT:       'bg-warning-light text-warning-dark',
    PAID:                  'bg-warning-light text-warning-dark',
    REFUNDED:              'bg-surface-100 text-surface-600',
    DRAFT:                 'bg-surface-100 text-surface-500',
  };
  return map[status] || 'bg-surface-100 text-surface-600';
};

export const getStatusLabel = (status: string, lang: 'FR' | 'EN' = 'FR') => {
  const fr: Record<string, string> = {
    DRAFT: 'Brouillon', PENDING_PAYMENT: 'Paiement en attente', PAID: 'Payé',
    SEARCHING_DRIVER: 'Recherche livreur', DRIVER_ASSIGNED: 'Livreur assigné',
    DRIVER_EN_ROUTE_PICKUP: 'Livreur en route', PICKED_UP: 'Récupéré',
    IN_TRANSIT: 'En transit', DELIVERED: 'Livré', CANCELLED: 'Annulé',
    DISPUTED: 'En litige', REFUNDED: 'Remboursé',
  };
  const en: Record<string, string> = {
    DRAFT: 'Draft', PENDING_PAYMENT: 'Awaiting payment', PAID: 'Paid',
    SEARCHING_DRIVER: 'Finding driver', DRIVER_ASSIGNED: 'Driver assigned',
    DRIVER_EN_ROUTE_PICKUP: 'Driver en route', PICKED_UP: 'Picked up',
    IN_TRANSIT: 'In transit', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
    DISPUTED: 'Disputed', REFUNDED: 'Refunded',
  };
  return (lang === 'EN' ? en : fr)[status] || status;
};
