'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, Loader2, TrendingUp } from 'lucide-react';

const TX_ICONS: Record<string, React.ElementType> = {
  ORDER_PAYMENT: ArrowUpRight,
  WALLET_TOPUP: ArrowDownLeft,
  WALLET_WITHDRAWAL: ArrowUpRight,
  DRIVER_EARNING: ArrowDownLeft,
  REFUND: ArrowDownLeft,
  PROMO_CREDIT: ArrowDownLeft,
  ADMIN_ADJUSTMENT: TrendingUp,
};

const TX_COLORS: Record<string, string> = {
  ORDER_PAYMENT: 'text-danger bg-danger-light',
  WALLET_TOPUP: 'text-success bg-success-light',
  DRIVER_EARNING: 'text-success bg-success-light',
  REFUND: 'text-success bg-success-light',
  WALLET_WITHDRAWAL: 'text-danger bg-danger-light',
  PROMO_CREDIT: 'text-info bg-info-light',
  ADMIN_ADJUSTMENT: 'text-warning bg-warning-light',
};

const TOPUP_AMOUNTS = [2000, 5000, 10000, 25000, 50000];

export default function WalletPage() {
  const qc = useQueryClient();
  const [topupAmount, setTopupAmount] = useState<number | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => paymentsApi.getWallet(),
  });

  const { mutate: topup, isPending: topping } = useMutation({
    mutationFn: (amount: number) => paymentsApi.topup(amount),
    onSuccess: () => {
      toast.success('Portefeuille rechargé !');
      setTopupAmount('');
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
    onError: () => toast.error('Erreur lors de la recharge'),
  });

  const wallet = data?.data?.data;
  const transactions = wallet?.transactions || [];

  const handleTopup = () => {
    const amount = Number(topupAmount);
    if (!amount || amount < 500) { toast.error('Montant minimum: 500 XOF'); return; }
    topup(amount);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="page-header">Portefeuille</h1>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-surface-900 to-primary-900 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white/60 text-sm">Solde disponible</p>
            {isLoading ? (
              <div className="skeleton w-32 h-7 mt-1 bg-white/20" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(wallet?.balance || 0)}</p>
            )}
          </div>
        </div>
        <p className="text-white/40 text-xs">{wallet?.currency || 'XOF'} · Franc CFA Ouest-Africain</p>
      </div>

      {/* Top up */}
      <div className="card p-5">
        <h2 className="section-header mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Recharger le portefeuille
        </h2>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {TOPUP_AMOUNTS.map((amt) => (
            <button
              key={amt} type="button"
              onClick={() => setTopupAmount(amt)}
              className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                topupAmount === amt
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-surface-200 text-surface-600 hover:border-surface-300'
              }`}
            >
              {(amt / 1000).toFixed(0)}k
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value ? Number(e.target.value) : '')}
            className="input flex-1"
            placeholder="Montant en XOF"
            min={500}
          />
          <button
            onClick={handleTopup}
            disabled={topping || !topupAmount}
            className="btn-primary flex items-center gap-2 px-5"
          >
            {topping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Recharger
          </button>
        </div>
        <p className="text-xs text-surface-400 mt-2">* Mode simulation — Intégrez votre passerelle de paiement ici</p>
      </div>

      {/* Transactions */}
      <div className="card">
        <div className="p-5 border-b border-surface-200">
          <h2 className="section-header">Transactions récentes</h2>
        </div>
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 text-primary-500 animate-spin" /></div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center">
            <Wallet className="w-10 h-10 text-surface-200 mx-auto mb-2" />
            <p className="text-surface-400 text-sm">Aucune transaction</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {transactions.map((tx: {
              id: string; type: string; amount: number;
              description: string; createdAt: string; reference: string;
            }) => {
              const Icon = TX_ICONS[tx.type] || TrendingUp;
              const colorClass = TX_COLORS[tx.type] || 'text-surface-500 bg-surface-100';
              const isCredit = ['WALLET_TOPUP', 'DRIVER_EARNING', 'REFUND', 'PROMO_CREDIT'].includes(tx.type);
              return (
                <div key={tx.id} className="flex items-center gap-4 p-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate">{tx.description || tx.type}</p>
                    <p className="text-xs text-surface-400">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className={`text-sm font-bold flex-shrink-0 ${isCredit ? 'text-success' : 'text-danger'}`}>
                    {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
