'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import {
  Users, Bike, Package, DollarSign, CheckCircle, XCircle,
  TrendingUp, Clock, ArrowRight, AlertTriangle, Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';

interface Stats {
  users: { total: number };
  drivers: { total: number; active: number; pending: number };
  orders: { total: number; today: number; month: number; delivered: number; cancelled: number; completionRate: number };
  revenue: { total: number; month: number; today: number };
  support: { pendingTickets: number };
}

export default function AdminDashboard() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['admin-analytics', '14'],
    queryFn: () => adminApi.getAnalytics('14'),
  });

  const stats: Stats | undefined = statsData?.data?.data;
  const chartData = analyticsData?.data?.data?.byDate || [];
  const vehicleData = analyticsData?.data?.data?.byVehicle
    ? Object.entries(analyticsData.data.data.byVehicle).map(([name, value]) => ({ name, value }))
    : [];

  const STAT_CARDS = stats ? [
    {
      label: 'Clients inscrits',
      value: stats.users.total,
      icon: Users,
      color: 'text-info bg-info-light',
      trend: '+12% ce mois',
    },
    {
      label: 'Livreurs actifs',
      value: `${stats.drivers.active} / ${stats.drivers.total}`,
      icon: Bike,
      color: 'text-primary-600 bg-primary-50',
      trend: `${stats.drivers.pending} en attente`,
      alert: stats.drivers.pending > 0,
      href: '/admin/drivers?status=PENDING_APPROVAL',
    },
    {
      label: 'Commandes aujourd\'hui',
      value: stats.orders.today,
      icon: Package,
      color: 'text-warning bg-warning-light',
      trend: `${stats.orders.month} ce mois`,
    },
    {
      label: 'Revenus du jour',
      value: formatCurrency(stats.revenue.today),
      icon: DollarSign,
      color: 'text-success bg-success-light',
      trend: `${formatCurrency(stats.revenue.month)} ce mois`,
    },
    {
      label: 'Taux de complétion',
      value: `${stats.orders.completionRate}%`,
      icon: CheckCircle,
      color: 'text-success bg-success-light',
      trend: `${stats.orders.delivered} livrées`,
    },
    {
      label: 'Annulations',
      value: stats.orders.cancelled,
      icon: XCircle,
      color: 'text-danger bg-danger-light',
      trend: 'total',
    },
    {
      label: 'Tickets support',
      value: stats.support.pendingTickets,
      icon: AlertTriangle,
      color: 'text-warning bg-warning-light',
      trend: 'non résolus',
      alert: stats.support.pendingTickets > 0,
      href: '/admin/support',
    },
    {
      label: 'Revenus totaux',
      value: formatCurrency(stats.revenue.total),
      icon: TrendingUp,
      color: 'text-info bg-info-light',
      trend: 'depuis le lancement',
    },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Tableau de bord</h1>
        <p className="text-surface-500 mt-1">Vue d'ensemble de la plateforme Rapide</p>
      </div>

      {/* Stats grid */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="skeleton w-9 h-9 rounded-xl mb-3" />
              <div className="skeleton w-20 h-6 mb-1" />
              <div className="skeleton w-28 h-3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ label, value, icon: Icon, color, trend, alert, href }) => {
            const card = (
              <div className={`card p-4 ${alert ? 'border-warning' : ''} ${href ? 'cursor-pointer hover:shadow-card-md transition-shadow' : ''}`}>
                <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-surface-900">{value}</div>
                <div className="text-surface-500 text-xs mt-0.5">{label}</div>
                <div className={`text-xs mt-1.5 font-medium ${alert ? 'text-warning' : 'text-surface-400'}`}>{trend}</div>
              </div>
            );
            return href ? (
              <Link key={label} href={href}>{card}</Link>
            ) : (
              <div key={label}>{card}</div>
            );
          })}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue / orders area chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-header">Commandes & revenus (14 jours)</h2>
            <Link href="/admin/analytics" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Voir plus <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-surface-300">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7', fontSize: 12 }}
                  formatter={(v, name) => [name === 'revenue' ? formatCurrency(Number(v)) : v, name === 'revenue' ? 'Revenus' : 'Commandes']}
                />
                <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} fill="none" dot={false} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#colorRevenue)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Vehicle distribution */}
        <div className="card p-5">
          <h2 className="section-header mb-5">Véhicules utilisés</h2>
          {vehicleData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-surface-300 text-sm">Pas de données</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={vehicleData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e4e7', fontSize: 12 }} />
                <Bar dataKey="value" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="section-header mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/admin/drivers?status=PENDING_APPROVAL', label: 'Approuver des livreurs', icon: Bike, color: 'bg-primary-500' },
            { href: '/admin/orders',     label: 'Gérer les commandes',    icon: Package,   color: 'bg-info' },
            { href: '/admin/support',    label: 'Tickets de support',      icon: Clock,     color: 'bg-warning' },
            { href: '/admin/pricing',    label: 'Configurer les tarifs',   icon: DollarSign,color: 'bg-success' },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href} className="card-hover p-4 flex items-center gap-3">
              <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-surface-900">{label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
