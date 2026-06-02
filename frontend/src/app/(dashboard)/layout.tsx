'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Globe, LayoutDashboard, FileText, CreditCard,
  MapPin, Bell, LogOut, ChevronRight, Shield, User as UserIcon, RefreshCw,
  Users, Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ToastContainer, useToast } from '@/components/ToastNotification';

const citizenNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',      color: '#3b82f6' },
  { href: '/apply',     icon: FileText,        label: 'Ajukan Paspor',  color: '#8b5cf6' },
  { href: '/tracker',   icon: Bell,            label: 'Lacak Status',   color: '#f59e0b' },
  { href: '/checkin',   icon: MapPin,          label: 'Check-in GPS',   color: '#10b981' },
  { href: '/payments',  icon: CreditCard,      label: 'Pembayaran',     color: '#f43f5e' },
  { href: '/profile',   icon: UserIcon,        label: 'Profil & NIK',   color: '#64748b' },
];

const adminNavItems = [
  { href: '/admin?tab=applications', icon: FileText,   label: 'Kelola Permohonan', color: '#3b82f6' },
  { href: '/admin?tab=users',        icon: Users,      label: 'Kelola Pengguna',   color: '#8b5cf6' },
  { href: '/profile',                icon: UserIcon,   label: 'Profil Admin',      color: '#64748b' },
];

function SidebarNav({ visibleNavItems, pathname, setSidebarOpen }: {
  visibleNavItems: any[], pathname: string, setSidebarOpen: (o: boolean) => void
}) {
  const searchParams = useSearchParams();

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {visibleNavItems.map((item) => {
        const active = (() => {
          if (item.href.startsWith('/admin')) {
            if (pathname !== '/admin') return false;
            const targetTab = item.href.includes('users') ? 'users' : 'applications';
            const activeTab = searchParams.get('tab') || 'applications';
            return activeTab === targetTab;
          }
          return pathname === item.href;
        })();

        return (
          <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden focus:outline-none
              ${active
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
            style={active ? {
              background: `linear-gradient(135deg, ${item.color}22, ${item.color}11)`,
              border: `1px solid ${item.color}30`,
            } : {
              background: 'transparent',
              border: '1px solid transparent',
            }}>

            {/* Active left border accent */}
            {active && (
              <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                style={{ background: item.color }} />
            )}

            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200
              ${active ? 'scale-105' : 'group-hover:scale-105'}`}
              style={active
                ? { background: `${item.color}20`, border: `1px solid ${item.color}40` }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid transparent' }}>
              <item.icon className="w-3.5 h-3.5" style={{ color: active ? item.color : undefined }} />
            </div>

            <span className={active ? 'font-semibold' : ''}>{item.label}</span>

            {active && <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0" style={{ color: item.color }} />}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout, refreshUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const { toasts, add: addToast, remove } = useToast();

  const isOfficerOrAdmin = user?.role === 'officer' || user?.role === 'admin';
  const visibleNavItems = isOfficerOrAdmin ? adminNavItems : citizenNavItems;

  useEffect(() => {
    // /admin has its own credential gate, don't force redirect to login
    if (!loading && !user && pathname !== '/admin') router.push('/login');
  }, [user, loading, router, pathname]);

  useEffect(() => {
    if (user) refreshUser();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkAdmin = () => {
        setAdminUnlocked(sessionStorage.getItem('passporto_admin_unlocked') === 'true');
      };
      checkAdmin();
      window.addEventListener('admin_auth_changed', checkAdmin);
      window.addEventListener('storage', checkAdmin);
      return () => {
        window.removeEventListener('admin_auth_changed', checkAdmin);
        window.removeEventListener('storage', checkAdmin);
      };
    }
  }, [pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem('passporto_admin_unlocked');
    logout();
  };

  const shouldHideSidebar = pathname === '/admin' && !adminUnlocked;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #f59e0b)' }}>
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)', color: 'var(--text)' }}>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      {!shouldHideSidebar && (
        <aside className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col transition-transform duration-300
          md:translate-x-0 md:flex
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border)',
          }}>

          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse-glow"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #f59e0b)' }}>
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
              <span className="gradient-text-blue">Pass</span>
              <span className="text-slate-100">Porto</span>
              {isOfficerOrAdmin && (
                <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded-md text-orange-300"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  Admin
                </span>
              )}
            </span>
          </div>

          {/* Navigation */}
          <Suspense fallback={
            <div className="flex-1 px-3 py-4 space-y-1">
              {[1,2,3,4].map(i => <div key={i} className="h-10 skeleton rounded-xl" />)}
            </div>
          }>
            <SidebarNav visibleNavItems={visibleNavItems} pathname={pathname} setSidebarOpen={setSidebarOpen} />
          </Suspense>

          {/* User Panel */}
          {user && (
            <div className="px-3 pb-4 border-t border-white/8 pt-3 flex-shrink-0">
              <Link href="/profile"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group mb-2">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                  style={{
                    background: user.role === 'admin'
                      ? 'linear-gradient(135deg, #ea580c, #FCBB13)'
                      : user.role === 'officer'
                      ? 'linear-gradient(135deg, #097DE9, #FCBB13)'
                      : 'linear-gradient(135deg, #3b82f6, #f59e0b)'
                  }}>
                  {user.role === 'admin' ? 'A' : user.role === 'officer' ? 'P' : (user.full_name || user.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {user.role === 'admin' ? 'Administrator' : user.role === 'officer' ? 'Petugas Imigrasi' : (user.full_name || user.email)}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {user.role === 'admin' ? (
                      <span className="flex items-center gap-1 text-[10px] text-orange-400 font-semibold">
                        <Sparkles className="w-2.5 h-2.5" />Admin System
                      </span>
                    ) : user.role === 'officer' ? (
                      <span className="flex items-center gap-1 text-[10px] text-blue-400 font-semibold">
                        <Shield className="w-2.5 h-2.5" />Petugas Imigrasi
                      </span>
                    ) : user.is_verified ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                        <Shield className="w-2.5 h-2.5" />NIK Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" />Belum Verified
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              <button id="sidebar-logout-btn" onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/8 transition-all cursor-pointer group">
                <LogOut className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Keluar</span>
              </button>
            </div>
          )}
        </aside>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && !shouldHideSidebar && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${!shouldHideSidebar ? 'md:pl-60' : ''}`}>
        {/* Mobile topbar */}
        {!shouldHideSidebar && (
          <header className="md:hidden flex items-center justify-between px-4 py-3.5 border-b border-white/8 flex-shrink-0"
            style={{ background: 'var(--bg-surface)' }}>
            <button id="mobile-menu-btn" onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-white/8 text-slate-300 transition-colors">
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <span className="gradient-text-blue">Pass</span><span className="text-slate-100">Porto</span>
            </span>
            <button onClick={() => refreshUser()} className="p-2 rounded-lg hover:bg-white/8 text-slate-400 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </header>
        )}

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Global Toasts */}
      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
}
