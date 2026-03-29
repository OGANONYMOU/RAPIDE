'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ordersApi, paymentsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { useLangStore } from '@/stores/lang.store';
import { Plus, Package, MapPin, Wallet, ArrowRight, Clock, CheckCircle, Loader2 } from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const { lang } = useLangStore();

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => ordersApi.list({ limit: '5' }),
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => paymentsApi.getWallet(),
  });

  const orders = ordersData?.data?.data || [];
  const wallet = walletData?.data?.data;

  const activeOrder = orders.find((o: { status: string }) =>
    ['SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_EN_ROUTE_PICKUP', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)
  );

  const stats = [
    { label: 'Livraisons totales', value: orders.length, icon: Package, color: 'text-primary-600 bg-primary-50' },
    { label: 'Livraisons ce mois', value: orders.filter((o: { status: string }) => o.status === 'DELIVERED').length, icon: CheckCircle, color: 'text-success bg-success-light' },
    { label: 'Solde portefeuille', value: formatCurrency(wallet?.balance || 0), icon: Wallet, color: 'text-info bg-info-light' },
    { label: 'En cours', value: activeOrder ? 1 : 0, icon: Clock, color: 'text-warning bg-warning-light' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">
            Bonjour, {user?.firstName} 👋
          </h1>
          <p className="text-surface-500 mt-1">Que souhaitez-vous envoyer aujourd'hui ?</p>
        </div>
        <Link href="/dashboard/orders/new" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" />
          Nouvelle livraison
        </Link>
      </div>

      {/* Active order banner */}
      {activeOrder && (
        <Link
          href={`/dashboard/tracking/${activeOrder.id}`}
          className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary-500 to-info text-white p-4 shadow-lg transition-shadow hover:shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Livraison en cours</p>
              <p className="text-white/80 text-xs">#{activeOrder.orderNumber} — {getStatusLabel(activeOrder.status, lang)}</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5" />
        </Link>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold text-surface-900">{value}</div>
            <div className="text-surface-500 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="section-header mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/dashboard/orders/new?type=STANDARD', label: 'Livraison standard', desc: 'Envoyer un colis', icon: Package, color: 'bg-primary-500' },
            { href: '/dashboard/orders/new?type=EXPRESS',  label: 'Livraison express',  desc: 'Urgence — 30 min', icon: Clock,    color: 'bg-info' },
            { href: '/dashboard/wallet/topup',             label: 'Recharger wallet',   desc: 'Ajouter des fonds', icon: Wallet,   color: 'bg-info' },
          ].map(({ href, label, desc, icon: Icon, color }) => (
            <Link key={href} href={href} className="card-hover p-4 flex items-center gap-4">
              <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-surface-900 text-sm">{label}</p>
                <p className="text-surface-400 text-xs">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-header">Livraisons récentes</h2>
          <Link href="/dashboard/orders" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="card p-12 flex justify-center">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 font-medium">Aucune livraison pour le moment</p>
            <p className="text-surface-400 text-sm mt-1">Créez votre première livraison dès maintenant</p>
            <Link href="/dashboard/orders/new" className="btn-primary inline-flex items-center gap-2 mt-4">
              <Plus className="w-4 h-4" /> Nouvelle livraison
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-surface-100">
            {orders.map((order: {
              id: string; orderNumber: string; status: string;
              pickupAddress: string; dropoffAddress: string;
              totalPrice: number; createdAt: string;
            }) => (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between p-4 hover:bg-surface-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-surface-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-surface-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-surface-900 text-sm">#{order.orderNumber}</p>
                    <p className="text-surface-400 text-xs truncate max-w-48">{order.dropoffAddress}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="font-semibold text-surface-900 text-sm">{formatCurrency(order.totalPrice)}</p>
                    <p className="text-surface-400 text-xs">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`badge ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status, lang)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
