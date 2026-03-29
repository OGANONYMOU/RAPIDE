'use client';

import { use, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { formatDate, getAssetUrl, getStatusColor, getStatusLabel } from '@/lib/utils';
import { useLangStore } from '@/stores/lang.store';
import {
  MapPin, Phone, Star, Package, CheckCircle, Clock,
  Bike, Car, Truck, Navigation, Loader2, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

const VEHICLE_ICONS: Record<string, React.ElementType> = { BIKE: Bike, CAR: Car, VAN: Truck, TRUCK: Truck };

const STATUS_TIMELINE = [
  'PAID', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED',
  'DRIVER_EN_ROUTE_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED',
];

export default function TrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { lang } = useLangStore();
  const socket = useSocket();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tracking', orderId],
    queryFn: () => trackingApi.getOrderTracking(orderId),
    refetchInterval: 15_000,
  });

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_order', orderId);
    socket.on('order_status_updated', () => refetch());
    socket.on('driver:location_updated', () => refetch());
    return () => {
      socket.emit('leave_order', orderId);
      socket.off('order_status_updated');
      socket.off('driver:location_updated');
    };
  }, [socket, orderId, refetch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const order = data?.data?.data;
  if (!order) return <div className="card p-8 text-center text-surface-500">Commande introuvable</div>;

  const driver = order.driver;
  const VehicleIcon = driver ? (VEHICLE_ICONS[driver.vehicleType] || Bike) : Bike;
  const currentStepIndex = STATUS_TIMELINE.indexOf(order.status);
  const isCompleted = order.status === 'DELIVERED';
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orders" className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-header">Suivi en direct</h1>
          <p className="text-surface-500 text-sm">Commande #{order.orderNumber}</p>
        </div>
      </div>

      {/* Map placeholder — replace with Mapbox/Google Maps in production */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-surface-800 to-surface-900 h-56 flex items-center justify-center relative">
          <div className="text-center text-surface-400">
            <Navigation className="w-10 h-10 mx-auto mb-2 text-primary-400" />
            <p className="text-sm font-medium text-white">Carte en direct</p>
            <p className="text-xs mt-1">Intégrez Mapbox GL ou Google Maps ici</p>
            {driver?.currentLat && (
              <p className="text-xs text-primary-300 mt-2">
                Livreur: {driver.currentLat.toFixed(4)}, {driver.currentLng?.toFixed(4)}
              </p>
            )}
          </div>
          {/* Animated pulse dot for driver position */}
          {driver && !isCompleted && !isCancelled && (
            <div className="absolute top-4 right-4">
              <div className="w-4 h-4 bg-primary-500 rounded-full animate-pulse-ring" />
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-header">Statut de la livraison</h2>
          <span className={`badge ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status, lang)}
          </span>
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <div className="relative">
            <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-surface-200" />
            <ul className="space-y-4">
              {STATUS_TIMELINE.map((status, i) => {
                const done = i < currentStepIndex || isCompleted;
                const active = i === currentStepIndex && !isCompleted;
                const historyItem = order.statusHistory?.find((h: { status: string; createdAt: string }) => h.status === status);
                return (
                  <li key={status} className="flex items-start gap-4 relative">
                    <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                      done    ? 'bg-primary-500 border-primary-500 text-white' :
                      active  ? 'bg-white border-primary-500 ring-4 ring-primary-100' :
                               'bg-white border-surface-200'
                    }`}>
                      {done ? <CheckCircle className="w-3.5 h-3.5" /> :
                      active ? <div className="w-2 h-2 bg-primary-500 rounded-full" /> :
                               <div className="w-2 h-2 bg-surface-200 rounded-full" />}
                    </div>
                    <div className="pb-1">
                      <p className={`text-sm font-semibold ${done || active ? 'text-surface-900' : 'text-surface-400'}`}>
                        {getStatusLabel(status, lang)}
                      </p>
                      {historyItem && (
                        <p className="text-xs text-surface-400">{formatDate(historyItem.createdAt)}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {isCancelled && (
          <div className="bg-danger-light text-danger-dark p-3 rounded-xl text-sm">
            ❌ Livraison annulée
            {order.cancellationReason && <p className="mt-1 text-xs">Raison: {order.cancellationReason}</p>}
          </div>
        )}
      </div>

      {/* Driver card */}
      {driver && !isCompleted && !isCancelled && (
        <div className="card p-5">
          <h2 className="section-header mb-4">Votre livreur</h2>
          <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                {driver.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getAssetUrl(driver.user.avatarUrl)} alt="Driver" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <span className="text-primary-700 font-bold text-lg">
                    {driver.user.firstName?.[0]}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-surface-900">{driver.user.firstName} {driver.user.lastName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />
                <span className="text-sm text-surface-600">{driver.rating?.toFixed(1) || '—'}</span>
                <span className="text-surface-300">·</span>
                <VehicleIcon className="w-3.5 h-3.5 text-surface-400" />
                <span className="text-sm text-surface-400">{driver.vehiclePlate || 'N/A'}</span>
              </div>
            </div>
            <a
              href={`tel:${driver.user.phone}`}
              className="w-11 h-11 bg-primary-500 rounded-xl flex items-center justify-center text-white hover:bg-primary-600 transition-colors flex-shrink-0"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </div>
      )}

      {/* Address summary */}
      <div className="card p-5 space-y-4">
        <h2 className="section-header">Détails de la livraison</h2>
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-1 pt-1">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <div className="w-0.5 bg-surface-200 flex-1" />
            <div className="w-3 h-3 bg-primary-500 rounded-full" />
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <p className="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-0.5">Départ</p>
              <p className="text-sm text-surface-900 font-medium">{order.pickupAddress}</p>
            </div>
            <div>
              <p className="text-xs text-surface-400 uppercase tracking-wide font-semibold mb-0.5">Arrivée</p>
              <p className="text-sm text-surface-900 font-medium">{order.dropoffAddress}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Proof of delivery */}
      {isCompleted && order.proofOfDeliveryUrl && (
        <div className="card p-5">
          <h2 className="section-header mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-success" /> Preuve de livraison
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getAssetUrl(order.proofOfDeliveryUrl)}
            alt="Preuve de livraison"
            className="w-full rounded-xl object-cover max-h-64"
          />
          {order.proofOfDeliveryNote && <p className="text-sm text-surface-500 mt-2">{order.proofOfDeliveryNote}</p>}
        </div>
      )}

      {/* Rate delivery */}
      {isCompleted && (
        <Link
          href={`/dashboard/orders/${orderId}/rate`}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          <Star className="w-4 h-4" />
          Évaluer la livraison
        </Link>
      )}

      {/* Chat button */}
      {!isCompleted && !isCancelled && driver && (
        <Link
          href={`/dashboard/orders/${orderId}/chat`}
          className="btn-secondary w-full flex items-center justify-center gap-2 py-3"
        >
          <Clock className="w-4 h-4" />
          Contacter le livreur
        </Link>
      )}
    </div>
  );
}
