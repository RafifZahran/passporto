'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FileText, CreditCard,
  MapPin, Bell, LogOut, ChevronRight, Shield, User as UserIcon, RefreshCw,
  Users, Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ToastContainer, useToast } from '@/components/ToastNotification';

const citizenNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',      color: '#6D8196' },
  { href: '/apply',     icon: FileText,        label: 'Ajukan Paspor',  color: '#6D8196' },
  { href: '/tracker',   icon: Bell,            label: 'Lacak Status',   color: '#6D8196' },
  { href: '/checkin',   icon: MapPin,          label: 'Check-in GPS',   color: '#6D8196' },
  { href: '/payments',  icon: CreditCard,      label: 'Pembayaran',     color: '#6D8196' },
  { href: '/profile',   icon: UserIcon,        label: 'Profil & NIK',   color: '#6D8196' },
];

const adminNavItems = [
  { href: '/admin?tab=applications', icon: FileText, label: 'Kelola Permohonan', color: '#6D8196' },
  { href: '/admin?tab=users',        icon: Users,    label: 'Kelola Pengguna',   color: '#6D8196' },
  { href: '/profile',                icon: UserIcon, label: 'Profil Admin',      color: '#6D8196' },
];

function SidebarNav({ visibleNavItems, pathname, setSidebarOpen }: {
  visibleNavItems: any[], pathname: string, setSidebarOpen: (o: boolean) => void
}) {
  const searchParams = useSearchParams();

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative focus:outline-none`}
            style={active ? {
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#ffffff',
            } : {
              background: 'transparent',
              border: '1px solid transparent',
              color: '#CBCBCB',
            }}
            onMouseEnter={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.color = '#ffffff';
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#CBCBCB';
              }
            }}>

            {/* Active left accent */}
            {active && (
              <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                style={{ background: '#ffffff' }} />
            )}

            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200`}
              style={active
                ? { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid transparent' }}>
              <item.icon className="w-3.5 h-3.5" style={{ color: active ? '#ffffff' : '#CBCBCB' }} />
            </div>

            <span style={{ color: active ? '#ffffff' : '#CBCBCB', fontWeight: active ? 500 : 400 }}>{item.label}</span>

            {active && <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0" style={{ color: '#ffffff' }} />}
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFFE3' }}>
        <div className="flex flex-col items-center gap-4">
          <span className="text-xl" style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#4A4A4A' }}>
            PassPorto
          </span>
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderTopColor: '#6D8196', borderColor: 'rgba(109,129,150,0.2)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#FFFFE3', color: '#4A4A4A' }}>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      {!shouldHideSidebar && (
        <aside className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col transition-transform duration-300 md:translate-x-0 md:flex ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{
            background: '#4A4A4A',
            borderRight: '1px solid rgba(255,255,255,0.08)',
          }}>

          {/* Logo */}
          <div className="flex items-center gap-2 px-5 py-5 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-base" style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#ffffff' }}>
              PassPorto
            </span>
            {isOfficerOrAdmin && (
              <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff' }}>
                Admin
              </span>
            )}
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
            <div className="px-3 pb-4 pt-3 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <Link href="/profile"
                className="flex items-center gap-3 p-3 rounded-xl transition-all group mb-2"
                style={{ background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}>
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: '#ffffff',
                    color: '#4A4A4A',
                  }}>
                  {user.role === 'admin' ? 'A' : user.role === 'officer' ? 'P' : (user.full_name || user.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: '#ffffff' }}>
                    {user.role === 'admin' ? 'Administrator' : user.role === 'officer' ? 'Petugas Imigrasi' : (user.full_name || user.email)}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: '#CBCBCB' }}>
                    {user.email}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {user.role === 'admin' ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#8fa0b0' }}>
                        <Sparkles className="w-2.5 h-2.5" />Admin System
                      </span>
                    ) : user.role === 'officer' ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#8fa0b0' }}>
                        <Shield className="w-2.5 h-2.5" />Petugas Imigrasi
                      </span>
                    ) : user.is_verified ? (
                      <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: '#82b58c' }}>
                        <Shield className="w-2.5 h-2.5" />NIK Verified
                      </span>
                    ) : (
                      <span className="text-[10px] flex items-center gap-1" style={{ color: '#d8a63b' }}>
                        <Shield className="w-2.5 h-2.5" />Belum Verified
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              <button id="sidebar-logout-btn" onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer group"
                style={{ color: '#CBCBCB', background: 'transparent', border: 'none' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#ff8080';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = '#CBCBCB';
                }}>
                <LogOut className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </aside>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && !shouldHideSidebar && (
        <div className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(74,74,74,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${!shouldHideSidebar ? 'md:pl-60' : ''}`}>
        {/* Mobile topbar */}
        {!shouldHideSidebar && (
          <header className="md:hidden flex items-center justify-between px-4 py-3.5 flex-shrink-0"
            style={{ background: '#ffffff', borderBottom: '1px solid rgba(74,74,74,0.08)' }}>
            <button id="mobile-menu-btn" onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#4A4A4A' }}>
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <span className="text-base" style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#4A4A4A' }}>
              PassPorto
            </span>
            <button onClick={() => refreshUser()} className="p-2 rounded-lg transition-colors" style={{ color: '#aaaaaa' }}>
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
