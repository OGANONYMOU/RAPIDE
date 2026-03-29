'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Zap, LayoutDashboard, Users, Bike, Package, Building,
  Tag, DollarSign, MessageSquare, BarChart2, Settings,
  Menu, X, LogOut, ChevronRight, FileText,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin',            icon: LayoutDashboard, label: 'Dashboard',   exact: true },
  { href: '/admin/users',      icon: Users,           label: 'Utilisateurs' },
  { href: '/admin/drivers',    icon: Bike,            label: 'Livreurs',     badge: 'pending' },
  { href: '/admin/orders',     icon: Package,         label: 'Commandes' },
  { href: '/admin/businesses', icon: Building,        label: 'Entreprises' },
  { href: '/admin/pricing',    icon: DollarSign,      label: 'Tarification' },
  { href: '/admin/promos',     icon: Tag,             label: 'Codes promo' },
  { href: '/admin/support',    icon: MessageSquare,   label: 'Support' },
  { href: '/admin/analytics',  icon: BarChart2,       label: 'Analytiques' },
  { href: '/admin/content',    icon: FileText,        label: 'Contenu' },
  { href: '/admin/settings',   icon: Settings,        label: 'Paramètres' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth, hasHydrated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.push('/login');
    else if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) router.push('/dashboard');
  }, [hasHydrated, user, router]);

  const handleLogout = () => { clearAuth(); router.push('/'); };

  if (!hasHydrated) {
    return <div className="min-h-screen bg-surface-100" />;
  }

  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return <div className="min-h-screen bg-surface-100" />;
  }

  const Sidebar = () => (
    <aside className="flex flex-col w-64 bg-surface-950 h-full">
      {/* Logo */}
      <div className="p-5 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <div>
            <span className="text-white font-bold">Rapide</span>
            <span className="block text-surface-400 text-2xs uppercase tracking-widest">Admin</span>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-b border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-surface-500 text-xs">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV.map(({ href, icon: Icon, label, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-surface-800">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-surface-400 hover:bg-surface-800 hover:text-danger w-full transition-all">
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-100">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 animate-slide-up">
            <Sidebar />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 z-20 text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-surface-200 h-14 px-4 sm:px-6 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-surface-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 hidden sm:block" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-surface-400 bg-surface-100 px-2.5 py-1 rounded-full font-medium">
              Tableau de bord Admin
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
