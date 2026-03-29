'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Bike, CheckCircle, XCircle, Eye, Loader2, Search, Filter } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'PENDING_APPROVAL', label: 'En attente' },
  { value: 'APPROVED', label: 'Approuvés' },
  { value: 'REJECTED', label: 'Rejetés' },
  { value: 'SUSPENDED', label: 'Suspendus' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: 'bg-warning-light text-warning-dark',
  APPROVED: 'bg-success-light text-success-dark',
  REJECTED: 'bg-danger-light text-danger-dark',
  SUSPENDED: 'bg-surface-100 text-surface-500',
  ONLINE: 'bg-info-light text-info-dark',
  OFFLINE: 'bg-surface-100 text-surface-500',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
  SUSPENDED: 'Suspendu',
  ONLINE: 'En ligne',
  OFFLINE: 'Hors ligne',
};

const VEHICLE_LABELS: Record<string, string> = { BIKE: 'Moto', CAR: 'Voiture', VAN: 'Fourgonnette', TRUCK: 'Camion' };

export default function AdminDriversPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');
  const [search, setSearch] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-drivers', statusFilter],
    queryFn: () => adminApi.listDrivers({ status: statusFilter || undefined, limit: '50' }),
  });

  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: (id: string) => adminApi.approveDriver(id),
    onSuccess: () => { toast.success('Livreur approuvé !'); qc.invalidateQueries({ queryKey: ['admin-drivers'] }); },
    onError: () => toast.error('Erreur lors de l\'approbation'),
  });

  const { mutate: reject, isPending: rejecting } = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectDriver(id, reason),
    onSuccess: () => {
      toast.success('Demande rejetée');
      setRejectId(null); setRejectReason('');
      qc.invalidateQueries({ queryKey: ['admin-drivers'] });
    },
    onError: () => toast.error('Erreur lors du rejet'),
  });

  const drivers = data?.data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Livreurs</h1>
          <p className="text-surface-500 mt-1">{data?.data?.meta?.total || 0} livreurs au total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Rechercher un livreur..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-surface-400 flex-shrink-0" />
          <div className="flex gap-1 flex-wrap">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  statusFilter === value
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 text-primary-500 animate-spin" /></div>
        ) : drivers.length === 0 ? (
          <div className="p-12 text-center">
            <Bike className="w-10 h-10 text-surface-200 mx-auto mb-2" />
            <p className="text-surface-400">Aucun livreur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  {['Livreur', 'Véhicule', 'Statut', 'Note', 'Livraisons', 'Inscrit le', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wide px-4 py-3 first:pl-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {drivers
                  .filter((d: { user: { firstName: string; lastName: string } }) =>
                    !search || `${d.user.firstName} ${d.user.lastName}`.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((driver: {
                    id: string; status: string; vehicleType: string; rating: number;
                    totalDeliveries: number; createdAt: string;
                    user: { firstName: string; lastName: string; email: string; phone: string; avatarUrl?: string };
                  }) => (
                    <tr key={driver.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-700 text-xs font-bold">
                              {driver.user.firstName?.[0]}{driver.user.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-surface-900">{driver.user.firstName} {driver.user.lastName}</p>
                            <p className="text-xs text-surface-400">{driver.user.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-surface-100 text-surface-700">
                          {VEHICLE_LABELS[driver.vehicleType] || driver.vehicleType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${STATUS_COLORS[driver.status] || 'bg-surface-100 text-surface-500'}`}>
                          {STATUS_LABELS[driver.status] || driver.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {driver.rating > 0 ? `⭐ ${driver.rating.toFixed(1)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-surface-600">{driver.totalDeliveries}</td>
                      <td className="px-4 py-3 text-xs text-surface-400">{formatDate(driver.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors" title="Voir le profil">
                            <Eye className="w-4 h-4 text-surface-400" />
                          </button>
                          {driver.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => approve(driver.id)}
                                disabled={approving}
                                className="flex items-center gap-1 text-xs font-semibold bg-success-light text-success-dark px-2.5 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                {approving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                Approuver
                              </button>
                              <button
                                onClick={() => setRejectId(driver.id)}
                                className="flex items-center gap-1 text-xs font-semibold bg-danger-light text-danger-dark px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Rejeter
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectId(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-slide-up">
            <h3 className="section-header mb-2">Rejeter la demande</h3>
            <p className="text-surface-500 text-sm mb-4">Veuillez indiquer la raison du rejet (visible par le livreur).</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input resize-none mb-4"
              rows={3}
              placeholder="Documents incomplets, véhicule non conforme..."
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectId(null)} className="btn-secondary flex-1">Annuler</button>
              <button
                onClick={() => reject({ id: rejectId, reason: rejectReason })}
                disabled={rejecting || !rejectReason.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2 bg-danger hover:bg-red-600"
              >
                {rejecting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
