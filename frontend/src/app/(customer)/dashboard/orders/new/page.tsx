'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ordersApi, pricingApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  MapPin, Package, Truck, CreditCard, ChevronRight,
  ChevronLeft, Loader2, Bike, Car, CheckCircle, Zap, Clock,
} from 'lucide-react';

const schema = z.object({
  pickupAddress: z.string().min(5, 'Adresse requise'),
  pickupLat: z.number(),
  pickupLng: z.number(),
  pickupContactName: z.string().optional(),
  pickupContactPhone: z.string().optional(),
  pickupNotes: z.string().optional(),
  dropoffAddress: z.string().min(5, 'Adresse requise'),
  dropoffLat: z.number(),
  dropoffLng: z.number(),
  dropoffContactName: z.string().min(2, 'Nom requis'),
  dropoffContactPhone: z.string().min(8, 'Téléphone requis'),
  dropoffNotes: z.string().optional(),
  packageCategory: z.string(),
  packageSize: z.string(),
  packageDescription: z.string().optional(),
  isFragile: z.boolean().default(false),
  deliveryType: z.string(),
  vehicleType: z.string(),
  paymentMethod: z.string(),
  promoCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = ['Adresses', 'Colis', 'Options', 'Paiement'];

const PACKAGE_CATEGORIES = [
  { value: 'PARCEL',      label: 'Colis',           icon: '📦' },
  { value: 'DOCUMENT',    label: 'Document',         icon: '📄' },
  { value: 'FOOD',        label: 'Nourriture',       icon: '🍱' },
  { value: 'ELECTRONICS', label: 'Électronique',     icon: '📱' },
  { value: 'FRAGILE',     label: 'Fragile',          icon: '🫙' },
  { value: 'MEDICINE',    label: 'Médicaments',      icon: '💊' },
  { value: 'OTHER',       label: 'Autre',            icon: '📫' },
];

const PACKAGE_SIZES = [
  { value: 'SMALL',       label: 'Petit',      desc: '< 5 kg',   price: '×1.0' },
  { value: 'MEDIUM',      label: 'Moyen',      desc: '5–15 kg',  price: '×1.3' },
  { value: 'LARGE',       label: 'Grand',      desc: '15–30 kg', price: '×1.6' },
  { value: 'EXTRA_LARGE', label: 'Très grand', desc: '> 30 kg',  price: '×2.0' },
];

const VEHICLE_TYPES = [
  { value: 'BIKE', label: 'Moto',          desc: 'Rapide en ville',     icon: Bike, price: 'Économique' },
  { value: 'CAR',  label: 'Voiture',       desc: 'Confort & sécurité',  icon: Car,  price: 'Standard' },
  { value: 'VAN',  label: 'Fourgonnette',  desc: 'Grandes charges',     icon: Truck,price: 'Premium' },
];

const DELIVERY_TYPES = [
  { value: 'STANDARD',  label: 'Standard',  desc: '2–4 heures',   icon: Package, fee: 0 },
  { value: 'EXPRESS',   label: 'Express',   desc: '30–60 minutes',icon: Zap,     fee: 500 },
  { value: 'SCHEDULED', label: 'Planifiée', desc: 'Choisir l\'heure', icon: Clock, fee: 0 },
];

const PAYMENT_METHODS = [
  { value: 'CASH',   label: 'Espèces',         desc: 'Payer à la livraison' },
  { value: 'WALLET', label: 'Portefeuille',     desc: 'Solde Rapide' },
  { value: 'CARD',   label: 'Carte bancaire',   desc: 'Visa / Mastercard' },
];

// Cotonou center as default coords for address inputs (would use Google Places in production)
const COTONOU = { lat: 6.3703, lng: 2.3912 };

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [priceEstimate, setPriceEstimate] = useState<null | { totalPrice: number; distanceKm: number; breakdown: Record<string, number> }>(null);

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      packageCategory: 'PARCEL',
      packageSize: 'SMALL',
      deliveryType: searchParams.get('type') || 'STANDARD',
      vehicleType: 'BIKE',
      paymentMethod: 'CASH',
      pickupLat: COTONOU.lat,
      pickupLng: COTONOU.lng,
      dropoffLat: COTONOU.lat + 0.02,
      dropoffLng: COTONOU.lng + 0.02,
      isFragile: false,
    },
  });

  const watchVehicle = watch('vehicleType');
  const watchSize = watch('packageSize');
  const watchDelivery = watch('deliveryType');
  const watchPayment = watch('paymentMethod');
  const watchCategory = watch('packageCategory');

  // Fetch price estimate when reaching step 3
  const { mutate: fetchEstimate, isPending: estimating } = useMutation({
    mutationFn: () => pricingApi.estimate({
      vehicleType: getValues('vehicleType'),
      packageSize: getValues('packageSize'),
      deliveryType: getValues('deliveryType'),
      pickupLat: getValues('pickupLat'),
      pickupLng: getValues('pickupLng'),
      dropoffLat: getValues('dropoffLat'),
      dropoffLng: getValues('dropoffLng'),
    }),
    onSuccess: (res) => setPriceEstimate(res.data.data),
  });

  const { mutate: createOrder, isPending: creating } = useMutation({
    mutationFn: (data: FormData) => ordersApi.create(data),
    onSuccess: (res) => {
      toast.success('Livraison créée avec succès !');
      router.push(`/dashboard/orders/${res.data.data.id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de la création';
      toast.error(msg);
    },
  });

  const nextStep = () => {
    if (step === 2) fetchEstimate();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = (data: FormData) => createOrder(data);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-header">Nouvelle livraison</h1>
        <p className="text-surface-500 mt-1">Remplissez les informations ci-dessous</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
              i < step ? 'bg-primary-500 text-white' :
              i === step ? 'bg-primary-500 text-white ring-4 ring-primary-100' :
              'bg-surface-200 text-surface-400'
            }`}>
              {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`ml-2 text-xs font-medium hidden sm:block ${i === step ? 'text-primary-700' : 'text-surface-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-primary-500' : 'bg-surface-200'}`} style={{ minWidth: 32 }} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-6">

          {/* ── Step 0: Addresses ─────────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="section-header flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" /> Adresses
              </h2>

              <div className="p-4 bg-green-50 rounded-xl border border-green-200 space-y-3">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">📍 Départ</p>
                <div>
                  <label className="label">Adresse de départ *</label>
                  <input {...register('pickupAddress')} className="input" placeholder="Ex: Rue 12-345, Cotonou" />
                  {errors.pickupAddress && <p className="text-danger text-xs mt-1">{errors.pickupAddress.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nom du contact</label>
                    <input {...register('pickupContactName')} className="input" placeholder="Facultatif" />
                  </div>
                  <div>
                    <label className="label">Téléphone</label>
                    <input {...register('pickupContactPhone')} className="input" placeholder="+229..." />
                  </div>
                </div>
                <div>
                  <label className="label">Notes départ</label>
                  <input {...register('pickupNotes')} className="input" placeholder="Portail bleu, 2ème étage..." />
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 space-y-3">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">🏁 Arrivée</p>
                <div>
                  <label className="label">Adresse de livraison *</label>
                  <input {...register('dropoffAddress')} className="input" placeholder="Ex: Av. Steinmetz, Cotonou" />
                  {errors.dropoffAddress && <p className="text-danger text-xs mt-1">{errors.dropoffAddress.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nom destinataire *</label>
                    <input {...register('dropoffContactName')} className="input" placeholder="Koffi Ama" />
                    {errors.dropoffContactName && <p className="text-danger text-xs mt-1">{errors.dropoffContactName.message}</p>}
                  </div>
                  <div>
                    <label className="label">Téléphone *</label>
                    <input {...register('dropoffContactPhone')} className="input" placeholder="+229..." />
                    {errors.dropoffContactPhone && <p className="text-danger text-xs mt-1">{errors.dropoffContactPhone.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="label">Notes livraison</label>
                  <input {...register('dropoffNotes')} className="input" placeholder="Sonner à la porte, livrer entre 9h-12h..." />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Package ───────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="section-header flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-500" /> Détails du colis
              </h2>

              <div>
                <label className="label">Type de colis</label>
                <div className="grid grid-cols-4 gap-2">
                  {PACKAGE_CATEGORIES.map(({ value, label, icon }) => (
                    <button
                      key={value} type="button"
                      onClick={() => setValue('packageCategory', value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        watchCategory === value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-surface-200 hover:border-surface-300'
                      }`}
                    >
                      <div className="text-xl mb-1">{icon}</div>
                      <p className="text-xs font-medium text-surface-700">{label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Taille / Poids estimé</label>
                <div className="grid grid-cols-2 gap-2">
                  {PACKAGE_SIZES.map(({ value, label, desc, price }) => (
                    <button
                      key={value} type="button"
                      onClick={() => setValue('packageSize', value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        watchSize === value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-surface-200 hover:border-surface-300'
                      }`}
                    >
                      <p className="font-semibold text-sm text-surface-900">{label}</p>
                      <p className="text-xs text-surface-400">{desc}</p>
                      <p className="text-xs text-primary-600 font-medium mt-1">{price}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Description (optionnel)</label>
                <textarea {...register('packageDescription')} className="input resize-none" rows={2} placeholder="Vêtements, livres, documents administratifs..." />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" {...register('isFragile')} className="w-4 h-4 accent-primary-500 rounded" />
                <span className="text-sm text-surface-700">🫙 Colis fragile — manipulation avec précaution</span>
              </label>
            </div>
          )}

          {/* ── Step 2: Delivery options ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="section-header flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary-500" /> Options de livraison
              </h2>

              <div>
                <label className="label">Type de livraison</label>
                <div className="space-y-2">
                  {DELIVERY_TYPES.map(({ value, label, desc, icon: Icon, fee }) => (
                    <button
                      key={value} type="button"
                      onClick={() => setValue('deliveryType', value)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                        watchDelivery === value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-surface-200 hover:border-surface-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${watchDelivery === value ? 'text-primary-600' : 'text-surface-400'}`} />
                        <div className="text-left">
                          <p className="font-semibold text-sm text-surface-900">{label}</p>
                          <p className="text-xs text-surface-400">{desc}</p>
                        </div>
                      </div>
                      {fee > 0 && <span className="text-xs font-semibold text-primary-600">+{formatCurrency(fee)}</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Type de véhicule</label>
                <div className="space-y-2">
                  {VEHICLE_TYPES.map(({ value, label, desc, icon: Icon, price }) => (
                    <button
                      key={value} type="button"
                      onClick={() => setValue('vehicleType', value)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                        watchVehicle === value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-surface-200 hover:border-surface-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${watchVehicle === value ? 'text-primary-600' : 'text-surface-400'}`} />
                        <div className="text-left">
                          <p className="font-semibold text-sm text-surface-900">{label}</p>
                          <p className="text-xs text-surface-400">{desc}</p>
                        </div>
                      </div>
                      <span className="text-xs text-surface-400">{price}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Payment & confirm ─────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="section-header flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-500" /> Paiement & confirmation
              </h2>

              {/* Price estimate */}
              {estimating ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              ) : priceEstimate && (
                <div className="bg-surface-50 rounded-xl p-4 border border-surface-200">
                  <p className="text-xs font-semibold text-surface-500 uppercase mb-3">Récapitulatif du prix</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-surface-500">Prix de base</span>
                      <span className="font-medium">{formatCurrency(priceEstimate.breakdown.base)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Distance ({priceEstimate.distanceKm} km)</span>
                      <span className="font-medium">{formatCurrency(priceEstimate.breakdown.distance)}</span>
                    </div>
                    {priceEstimate.breakdown.urgency > 0 && (
                      <div className="flex justify-between">
                        <span className="text-surface-500">Frais express</span>
                        <span className="font-medium">{formatCurrency(priceEstimate.breakdown.urgency)}</span>
                      </div>
                    )}
                    <div className="border-t border-surface-200 pt-2 flex justify-between font-bold">
                      <span className="text-surface-900">Total</span>
                      <span className="text-primary-600 text-base">{formatCurrency(priceEstimate.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Promo code */}
              <div>
                <label className="label">Code promo (optionnel)</label>
                <div className="flex gap-2">
                  <input {...register('promoCode')} className="input flex-1" placeholder="RAPIDE10" />
                  <button type="button" className="btn-secondary px-4">Appliquer</button>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="label">Mode de paiement</label>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(({ value, label, desc }) => (
                    <button
                      key={value} type="button"
                      onClick={() => setValue('paymentMethod', value)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                        watchPayment === value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-surface-200 hover:border-surface-300'
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-semibold text-sm text-surface-900">{label}</p>
                        <p className="text-xs text-surface-400">{desc}</p>
                      </div>
                      {watchPayment === value && <CheckCircle className="w-5 h-5 text-primary-500" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Nav buttons */}
        <div className="flex justify-between mt-6">
          <button
            type="button" onClick={prevStep}
            className={`btn-secondary flex items-center gap-2 ${step === 0 ? 'invisible' : ''}`}
          >
            <ChevronLeft className="w-4 h-4" /> Retour
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2">
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2 px-8">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {creating ? 'Création...' : 'Confirmer la livraison'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
