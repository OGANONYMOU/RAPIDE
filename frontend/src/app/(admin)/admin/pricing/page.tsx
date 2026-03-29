'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { DollarSign, Edit2, Save, X, Loader2 } from 'lucide-react';

const VEHICLES = ['BIKE', 'CAR', 'VAN', 'TRUCK'];
const VEHICLE_LABELS: Record<string, string> = { BIKE: '🏍 Moto', CAR: '🚗 Voiture', VAN: '🚐 Fourgonnette', TRUCK: '🚛 Camion' };

interface PricingRule {
  id: string; vehicleType: string; name: string;
  basePrice: number; pricePerKm: number; minimumPrice: number;
  minimumDistance: number; isActive: boolean;
}

export default function AdminPricingPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PricingRule>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pricing'],
    queryFn: () => adminApi.getPricingRules(),
  });

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: ({ vehicleType, data }: { vehicleType: string; data: Partial<PricingRule> }) =>
      adminApi.upsertPricingRule(vehicleType, data),
    onSuccess: () => {
      toast.success('Tarif mis à jour !');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['admin-pricing'] });
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const rules: PricingRule[] = data?.data?.data || [];

  const startEdit = (rule: PricingRule) => {
    setEditing(rule.vehicleType);
    setEditValues({ ...rule });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Tarification</h1>
        <p className="text-surface-500 mt-1">Configurez les prix par type de véhicule</p>
      </div>

      {/* Pricing cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VEHICLES.map((v) => <div key={v} className="card p-6 skeleton h-48" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VEHICLES.map((vehicleType) => {
            const rule = rules.find((r) => r.vehicleType === vehicleType);
            const isEditing = editing === vehicleType;

            return (
              <div key={vehicleType} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center text-lg">
                      {VEHICLE_LABELS[vehicleType].split(' ')[0]}
                    </div>
                    <div>
                      <p className="font-bold text-surface-900">{VEHICLE_LABELS[vehicleType].split(' ')[1]}</p>
                      <p className="text-xs text-surface-400">{rule?.name || 'Non configuré'}</p>
                    </div>
                  </div>
                  {!isEditing ? (
                    <button onClick={() => rule && startEdit(rule)} className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
                      <Edit2 className="w-4 h-4 text-surface-400" />
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => save({ vehicleType, data: { ...editValues, id: rule?.id } })}
                        disabled={saving}
                        className="p-2 bg-success-light text-success-dark rounded-xl hover:bg-green-100 transition-colors"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setEditing(null)} className="p-2 bg-surface-100 rounded-xl hover:bg-surface-200 transition-colors">
                        <X className="w-4 h-4 text-surface-400" />
                      </button>
                    </div>
                  )}
                </div>

                {rule ? (
                  <div className="space-y-3">
                    {[
                      { key: 'basePrice', label: 'Prix de base', suffix: ' XOF' },
                      { key: 'pricePerKm', label: 'Prix par km', suffix: ' XOF/km' },
                      { key: 'minimumPrice', label: 'Prix minimum', suffix: ' XOF' },
                    ].map(({ key, label, suffix }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-surface-500">{label}</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={(editValues as Record<string, unknown>)[key] as number || 0}
                            onChange={(e) => setEditValues((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                            className="input w-28 py-1.5 text-right text-sm"
                          />
                        ) : (
                          <span className="font-semibold text-surface-900 text-sm">
                            {formatCurrency((rule as unknown as Record<string, number>)[key])}{suffix.replace(' XOF', '')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <DollarSign className="w-8 h-8 text-surface-200 mx-auto mb-2" />
                    <p className="text-sm text-surface-400">Tarif non configuré</p>
                    <button
                      onClick={() => {
                        setEditing(vehicleType);
                        setEditValues({ vehicleType, name: `Tarif ${VEHICLE_LABELS[vehicleType].split(' ')[1]}`, basePrice: 0, pricePerKm: 0, minimumPrice: 0, minimumDistance: 1, isActive: true });
                      }}
                      className="btn-primary mt-3 text-xs py-1.5 px-4"
                    >
                      Configurer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="bg-info-light border border-info text-info-dark p-4 rounded-xl text-sm">
        <p className="font-semibold mb-1">💡 Logique de tarification</p>
        <p>Prix total = (Prix de base + Distance × Prix/km) × Multiplicateur taille + Frais d'urgence (Express)</p>
      </div>
    </div>
  );
}
