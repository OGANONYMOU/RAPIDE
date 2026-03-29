'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Zap, LayoutDashboard, Package, MapPin, Wallet, User, Bell,
  HelpCircle, LogOut, Menu, X, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useLangStore } from '@/stores/lang.store';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard',          icon: LayoutDashboard, labelKey: 'Tableau de bord' },
  { href: '/dashboard/orders',   icon: Package,         labelKey: 'Mes livraisons' },
  { href: '/dashboard/tracking', icon: MapPin,          labelKey: 'Suivi en direct' },
  { href: '/dashboard/wallet',   icon: Wallet,          labelKey: 'Portefeuille' },
  { href: '/dashboard/profile',  icon: User,            labelKey: 'Mon profil' },
  { href: '/dashboard/support',  icon: HelpCircle,      labelKey: 'Aide & Support' },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth, hasHydrated } = useAuthStore();
  const { lang, setLang, hasHydrated: langHydrated } = useLangStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsApi.list({ limit: '1' }),
    refetchInterval: 30_000,
    enabled: hasHydrated && !!user && user.role === 'CUSTOMER',
  });
  const unreadCount = notifData?.data?.meta?.unreadCount || 0;

  // Protect route
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.push('/login');
    else if (user.role !== 'CUSTOMER') {
      if (user.role === 'DRIVER') router.push('/driver/dashboard');
      else router.push('/admin');
    }
  }, [hasHydrated, user, router]);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  if (!hasHydrated || !langHydrated) {
    return <div className="min-h-screen bg-surface-50" />;
  }

  if (!user || user.role !== 'CUSTOMER') {
    return <div className="min-h-screen bg-surface-50" />;
  }

  const Sidebar = ({ mobile = false }) => (
    <aside className={cn(
      'flex flex-col bg-white border-r border-surface-200 h-full',
      mobile ? 'w-full' : 'w-64'
    )}>
      {/* Logo */}
      <div className="p-5 border-b border-surface-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="text-lg font-bold text-surface-900">Rapide</span>
        </Link>
      </div>

      {/* User summary */}
      <div className="p-4 border-b border-surface-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-bold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-surface-900 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-surface-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn('sidebar-link', isActive && 'active')}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{labelKey}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-surface-200 space-y-1">
        <div className="flex items-center gap-1 px-3 py-2">
          <span className="text-xs text-surface-400 mr-2">Langue:</span>
          {(['FR', 'EN'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                'text-xs px-2 py-0.5 rounded-md transition-all',
                lang === l ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-surface-400 hover:text-surface-600'
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-danger hover:bg-danger-light">
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-surface-950/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 w-72 animate-slide-up">
            <Sidebar mobile />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 z-10 text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-surface-200 px-4 sm:px-6 h-14 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-surface-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Link href="/dashboard/notifications" className="relative p-2 hover:bg-surface-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-surface-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary-500 text-white text-2xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
