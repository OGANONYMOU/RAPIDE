'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Package, Search, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'SEARCHING_DRIVER', label: 'Recherche livreur' },
  { value: 'IN_TRANSIT', label: 'En transit' },
  { value: 'DELIVERED', label: 'Livrés' },
  { value: 'CANCELLED', label: 'Annulés' },
  { value: 'DISPUTED', label: 'En litige' },
];

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, search, page],
    queryFn: () => adminApi.listOrders({ status: status || undefined, search: search || undefined, page, limit: 20 }),
  });

  const orders = data?.data?.data || [];
  const meta = data?.data?.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Commandes</h1>
        <p className="text-surface-500 mt-1">{meta?.total || 0} commandes au total</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-10" placeholder="Numéro de commande..." />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => { setStatus(value); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                status === value ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 text-primary-500 animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-surface-200 mx-auto mb-2" />
            <p className="text-surface-400">Aucune commande</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    {['Commande', 'Client', 'Livreur', 'Statut', 'Montant', 'Paiement', 'Date', ''].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wide px-4 py-3 first:pl-5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {orders.map((o: {
                    id: string; orderNumber: string; status: string;
                    totalPrice: number; paymentMethod: string; createdAt: string;
                    customer: { user: { firstName: string; lastName: string } };
                    driver: { user: { firstName: string; lastName: string } } | null;
                  }) => (
                    <tr key={o.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 pl-5">
                        <p className="text-sm font-mono font-semibold text-surface-900">#{o.orderNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-700">
                        {o.customer?.user?.firstName} {o.customer?.user?.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-500">
                        {o.driver ? `${o.driver.user.firstName} ${o.driver.user.lastName}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-surface-900">{formatCurrency(o.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-surface-100 text-surface-600">{o.paymentMethod}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-surface-400">{formatDate(o.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${o.id}`} className="p-1.5 hover:bg-surface-100 rounded-lg inline-flex">
                          <Eye className="w-4 h-4 text-surface-400" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-surface-200">
                <p className="text-xs text-surface-400">Page {meta.page} sur {meta.pages}</p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">← Précédent</button>
                  <button disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Suivant →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
