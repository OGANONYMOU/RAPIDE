'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useSocket } from '@/hooks/useSocket';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Power, MapPin, Star, Package, TrendingUp,
  Bell, AlertTriangle, Loader2, CheckCircle,
  Navigation, Clock, Zap, LogOut,
} from 'lucide-react';
import Link from 'next/link';

export default function DriverDashboard() {
  const router = useRouter();
  const { user, clearAuth, hasHydrated } = useAuthStore();
  const socket = useSocket();
  const qc = useQueryClient();
  const [pendingOrder, setPendingOrder] = useState<Record<string, unknown> | null>(null);

  // Guard
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.push('/login');
    else if (user.role !== 'DRIVER') router.push('/dashboard');
  }, [hasHydrated, user, router]);

  const { data: profileData } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => driverApi.getProfile(),
    enabled: hasHydrated && !!user && user.role === 'DRIVER',
  });

  const { data: earningsData } = useQuery({
    queryKey: ['driver-earnings', 'week'],
    queryFn: () => driverApi.getEarnings('week'),
    enabled: hasHydrated && !!user && user.role === 'DRIVER',
  });

  const { mutate: toggleOnline, isPending: toggling } = useMutation({
    mutationFn: (isOnline: boolean) => driverApi.setOnlineStatus(isOnline),
    onSuccess: (_, isOnline) => {
      toast.success(isOnline ? 'Vous êtes en ligne !' : 'Vous êtes hors ligne');
      qc.invalidateQueries({ queryKey: ['driver-profile'] });
      if (socket) {
        socket.emit('driver:set_online', {
          isOnline,
          vehicleType: profileData?.data?.data?.vehicleType,
        });
      }
    },
  });

  const driver = profileData?.data?.data;
  const earnings = earningsData?.data?.data;
  const isPendingApproval = driver?.status === 'PENDING_APPROVAL';
  const isOnline = driver?.isOnline;

  // Listen for new order requests
  useEffect(() => {
    if (!socket) return;
    socket.on('new_order_available', (order: Record<string, unknown>) => {
      setPendingOrder(order);
      // Auto-dismiss after 30s
      setTimeout(() => setPendingOrder(null), 30_000);
    });
    return () => { socket.off('new_order_available'); };
  }, [socket]);

  const handleLogout = () => { clearAuth(); router.push('/'); };

  if (!hasHydrated) {
    return <div className="min-h-screen bg-surface-50" />;
  }

  if (!user || user.role !== 'DRIVER') {
    return <div className="min-h-screen bg-surface-50" />;
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Top bar */}
      <header className="bg-white border-b border-surface-200 px-4 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-bold text-surface-900">Rapide</span>
          <span className="text-surface-300">·</span>
          <span className="text-xs text-surface-400">Livreur</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/driver/notifications" className="p-2 hover:bg-surface-100 rounded-xl">
            <Bell className="w-5 h-5 text-surface-500" />
          </Link>
          <button onClick={handleLogout} className="p-2 hover:bg-surface-100 rounded-xl">
            <LogOut className="w-5 h-5 text-surface-500" />
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-5">

        {/* Pending approval banner */}
        {isPendingApproval && (
          <div className="bg-warning-light border border-warning rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-warning-dark">Compte en attente d'approbation</p>
                <p className="text-warning-dark/70 text-sm mt-1">
                  Notre équipe examine votre dossier. Vous recevrez une notification dès que votre compte sera activé.
                </p>
                <Link href="/driver/documents" className="text-warning-dark font-semibold text-sm underline mt-2 inline-block">
                  Compléter mon dossier →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Driver info + Online toggle */}
        {!isPendingApproval && (
          <div className={`rounded-2xl p-5 text-white ${isOnline ? 'bg-gradient-to-br from-primary-600 to-info' : 'bg-gradient-to-br from-surface-800 to-surface-900'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-lg">{user?.firstName} {user?.lastName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-yellow-300" fill="currentColor" />
                  <span className="text-sm">{driver?.rating?.toFixed(1) || '—'}</span>
                  <span className="opacity-40">·</span>
                  <span className="text-sm opacity-70">{driver?.totalDeliveries || 0} livraisons</span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isOnline ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'}`}>
                {isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}
              </div>
            </div>

            <button
              onClick={() => toggleOnline(!isOnline)}
              disabled={toggling}
              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isOnline
                  ? 'bg-white/15 hover:bg-white/25 text-white'
                  : 'bg-primary-500 hover:bg-primary-600 text-white'
              }`}
            >
              {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
              {toggling ? 'Mise à jour...' : isOnline ? 'Se mettre hors ligne' : 'Se mettre en ligne'}
            </button>
          </div>
        )}

        {/* Incoming order alert */}
        {pendingOrder && (
          <div className="card border-2 border-primary-500 p-5 animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              <p className="font-bold text-surface-900">Nouvelle livraison disponible !</p>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex gap-2 items-start">
                <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-surface-700">{String(pendingOrder.pickupAddress)}</p>
              </div>
              <div className="flex gap-2 items-start">
                <Navigation className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-surface-700">{String(pendingOrder.dropoffAddress)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4 bg-surface-50 rounded-xl p-3">
              <div>
                <p className="text-xs text-surface-400">Vos gains</p>
                <p className="font-bold text-primary-600">{formatCurrency(Number(pendingOrder.driverEarning))}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">Distance</p>
                <p className="font-bold text-surface-900">{Number(pendingOrder.distanceKm).toFixed(1)} km</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPendingOrder(null)} className="btn-secondary flex-1 py-3">Refuser</button>
              <button
                onClick={() => {
                  if (socket) socket.emit('driver:accept_order', { orderId: pendingOrder.orderId });
                  setPendingOrder(null);
                  toast.success('Commande acceptée !');
                }}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Accepter
              </button>
            </div>
          </div>
        )}

        {/* Earnings summary */}
        {earnings && (
          <div>
            <h2 className="section-header mb-3">Gains de la semaine</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Revenus', value: formatCurrency(earnings.summary.totalEarnings), icon: TrendingUp, color: 'text-success bg-success-light' },
                { label: 'Livraisons', value: earnings.summary.totalDeliveries, icon: Package, color: 'text-primary-600 bg-primary-50' },
                { label: 'Note moy.', value: earnings.summary.rating?.toFixed(1) || '—', icon: Star, color: 'text-warning bg-warning-light' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card p-3 text-center">
                  <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-surface-900 text-sm">{value}</p>
                  <p className="text-surface-400 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick nav */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/driver/deliveries', icon: Package, label: 'Mes livraisons', desc: 'Historique complet' },
            { href: '/driver/earnings',   icon: TrendingUp, label: 'Mes revenus', desc: 'Détails & retraits' },
            { href: '/driver/documents',  icon: CheckCircle, label: 'Mes documents', desc: 'Gérer mon dossier' },
            { href: '/driver/profile',    icon: Clock, label: 'Mon profil', desc: 'Informations véhicule' },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href} className="card-hover p-4">
              <Icon className="w-5 h-5 text-primary-500 mb-2" />
              <p className="font-semibold text-sm text-surface-900">{label}</p>
              <p className="text-surface-400 text-xs">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
