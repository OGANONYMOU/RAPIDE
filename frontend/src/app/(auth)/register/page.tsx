'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff, Loader2, User, Bike } from 'lucide-react';
import { authApi } from '@/lib/api';

const schema = z.object({
  firstName: z.string().min(2, 'Minimum 2 caractères'),
  lastName: z.string().min(2, 'Minimum 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(8, 'Numéro invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
  vehicleType: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const VEHICLE_TYPES = [
  { value: 'BIKE',  label: 'Moto' },
  { value: 'CAR',   label: 'Voiture' },
  { value: 'VAN',   label: 'Fourgonnette' },
  { value: 'TRUCK', label: 'Camion' },
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') === 'driver' ? 'DRIVER' : 'CUSTOMER';
  const [role, setRole] = useState<'CUSTOMER' | 'DRIVER'>(defaultRole as 'CUSTOMER' | 'DRIVER');
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, role, language: 'FR' };
      if (role === 'DRIVER' && !data.vehicleType) {
        toast.error('Veuillez choisir votre type de véhicule');
        return;
      }
      await authApi.register(payload);
      toast.success(
        role === 'DRIVER'
          ? 'Inscription réussie ! En attente d\'approbation.'
          : 'Compte créé ! Vérifiez votre email.'
      );
      router.push('/login');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur lors de l\'inscription';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-primary-950 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold text-white">Rapide</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Créer votre compte</h1>
        </div>

        <div className="card p-8">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-surface-100 rounded-xl">
            {[
              { value: 'CUSTOMER', icon: User,  label: 'Client' },
              { value: 'DRIVER',   icon: Bike, label: 'Livreur' },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value as 'CUSTOMER' | 'DRIVER')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  role === value
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Prénom</label>
                <input {...register('firstName')} className="input" placeholder="Kofi" />
                {errors.firstName && <p className="text-danger text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Nom</label>
                <input {...register('lastName')} className="input" placeholder="Mensah" />
                {errors.lastName && <p className="text-danger text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="vous@exemple.com" />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Téléphone</label>
              <input {...register('phone')} type="tel" className="input" placeholder="+229 61 00 00 00" />
              {errors.phone && <p className="text-danger text-xs mt-1">{errors.phone.message}</p>}
            </div>

            {role === 'DRIVER' && (
              <div>
                <label className="label">Type de véhicule</label>
                <select {...register('vehicleType')} className="input">
                  <option value="">Choisir un véhicule</option>
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
                {errors.vehicleType && <p className="text-danger text-xs mt-1">{errors.vehicleType.message}</p>}
              </div>
            )}

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <input {...register('password')} type={showPass ? 'text' : 'password'} className="input pr-12" placeholder="Minimum 8 caractères" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirmer le mot de passe</label>
              <input {...register('confirmPassword')} type="password" className="input" placeholder="••••••••" />
              {errors.confirmPassword && <p className="text-danger text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {role === 'DRIVER' && (
              <div className="bg-warning-light border border-warning text-warning-dark text-xs p-3 rounded-lg">
                ⚠️ Votre compte livreur sera activé après vérification par notre équipe (24-48h).
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            Déjà inscrit ?{' '}
            <Link href="/login" className="text-primary-600 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
