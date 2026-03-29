'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi, getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useLangStore } from '@/stores/lang.store';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { t, hasHydrated } = useLangStore();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data.email, data.password);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(t('auth.loginSuccess'));

      // Redirect based on role
      if (user.role === 'CUSTOMER') router.push('/dashboard');
      else if (user.role === 'DRIVER') router.push('/driver/dashboard');
      else router.push('/admin');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t('errors.serverError')));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-primary-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold text-white">Rapide</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Bon retour 👋</h1>
          <p className="text-surface-400 mt-2">Connectez-vous à votre compte</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label className="label">{t('auth.email')}</label>
              <input
                {...register('email')}
                type="email"
                className="input"
                placeholder="vous@exemple.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">{t('auth.password')}</label>
                <Link href="/forgot-password" className="text-xs text-primary-600 hover:underline">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  className="input pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSubmitting ? 'Connexion...' : t('auth.login')}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="text-primary-600 font-semibold hover:underline">
              {t('auth.register')}
            </Link>
          </p>
        </div>

        {/* Language toggle */}
        {hasHydrated ? <LanguageToggle /> : null}
      </div>
    </div>
  );
}

function LanguageToggle() {
  const { lang, setLang } = useLangStore();
  return (
    <div className="flex justify-center mt-6 gap-2">
      {(['FR', 'EN'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`text-xs px-3 py-1 rounded-full transition-all ${
            lang === l
              ? 'bg-primary-500 text-white'
              : 'text-surface-400 hover:text-white'
          }`}
        >
          {l === 'FR' ? '🇫🇷 Français' : '🇬🇧 English'}
        </button>
      ))}
    </div>
  );
}
