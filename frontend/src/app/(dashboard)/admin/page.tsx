'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users, FileText, Search, Shield, Clock, CheckCircle,
  Printer, Package, Edit, RefreshCw, AlertCircle, Award, Check, User, X,
  Lock, KeyRound
} from 'lucide-react';
import { officerApi, applicationsApi } from '@/lib/api';
import type { Application, User as UserType, ApplicationStatus, UserRole } from '@/lib/types';
import { ToastContainer, useToast } from '@/components/ToastNotification';
import { useAuth } from '@/lib/auth-context';

const statusConfig = {
  Pending:  { label: 'Menunggu', className: 'status-pending',  icon: Clock,        next: 'Verified', nextLabel: 'Verifikasi Pembayaran' },
  Verified: { label: 'Terverifikasi', className: 'status-verified', icon: CheckCircle, next: 'Printing', nextLabel: 'Proses Cetak' },
  Printing: { label: 'Dicetak', className: 'status-printing', icon: Printer,      next: 'Ready',    nextLabel: 'Tandai Siap Ambil' },
  Ready:    { label: 'Siap Diambil', className: 'status-ready',    icon: Package,     next: 'Completed', nextLabel: 'Serahkan Paspor' },
  Completed: { label: 'Selesai', className: 'status-completed', icon: Check,        next: null,       nextLabel: '' },
};

function AdminPageContent() {
  const { user, login: authLogin, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'applications' | 'users'>('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appSearch, setAppSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Selected detail application modal state
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Administrative credentials gate state
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam === 'applications' || tabParam === 'users') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const { toasts, add: addToast, remove } = useToast();

  const fetchData = async (isManual = false) => {
    setRefreshing(true);
    try {
      const [appRes, userRes] = await Promise.all([
        officerApi.getAllApplications(),
        officerApi.getAllUsers(),
      ]);
      setApplications(appRes.data.applications || []);
      setUsers(userRes.data.users || []);
      if (isManual) {
        addToast({ type: 'success', title: 'Data Diperbarui', body: 'Seluruh data permohonan dan pengguna telah dimuat ulang.' });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Gagal Memuat Data',
        body: err.response?.data?.error || 'Pastikan koneksi backend aktif.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isUnlocked = sessionStorage.getItem('passporto_admin_unlocked') === 'true';
      setAuthorized(isUnlocked);
      setCheckingAuth(false);
      if (isUnlocked) {
        fetchData();
      }
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Support both "admin" and "admin@mail.com" as valid username inputs
    const loginEmail = adminUsername === 'admin' ? 'admin@mail.com' : adminUsername;

    if (loginEmail === 'admin@mail.com' && adminPassword === 'admin12345') {
      try {
        // Authenticate as the real admin user in the database
        await authLogin(loginEmail, adminPassword, null);
        
        sessionStorage.setItem('passporto_admin_unlocked', 'true');
        setAuthorized(true);
        setAuthError('');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('admin_auth_changed'));
        }

        fetchData();
        addToast({
          type: 'success',
          title: 'Verifikasi Berhasil',
          body: 'Selamat datang di Panel Admin PassPorto.',
        });
      } catch (err: any) {
        setAuthError(err.response?.data?.error || 'Gagal login ke akun admin database.');
      }
    } else {
      setAuthError('Kredensial salah! Harap periksa Username dan Password.');
    }
  };

  const handleUpdateStatus = async (appId: string, nextStatus: string) => {
    try {
      await applicationsApi.updateStatus(appId, nextStatus);
      addToast({
        type: 'success',
        title: 'Status Diperbarui',
        body: `Permohonan berhasil diupdate ke status: ${nextStatus}.`,
      });
      // Refresh list
      const appRes = await officerApi.getAllApplications();
      setApplications(appRes.data.applications || []);
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, status: nextStatus as ApplicationStatus } : null);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Gagal Mengubah Status',
        body: err.response?.data?.error || 'Terjadi kesalahan pada server.',
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await officerApi.updateUserRole(userId, newRole);
      addToast({
        type: 'success',
        title: 'Role Diperbarui',
        body: `User role berhasil diupdate ke: ${newRole}.`,
      });
      // Refresh list
      const userRes = await officerApi.getAllUsers();
      setUsers(userRes.data.users || []);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Gagal Mengubah Role',
        body: err.response?.data?.error || 'Terjadi kesalahan pada server.',
      });
    }
  };

  // Filter lists
  const filteredApps = applications.filter(app => {
    const matchesSearch = app.full_name.toLowerCase().includes(appSearch.toLowerCase()) || 
                          app.nik.includes(appSearch);
    const matchesFilter = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredUsers = users.filter(u => {
    return u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
           (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase())) ||
           (u.nik && u.nik.includes(userSearch));
  });

  const stats = {
    totalApps: applications.length,
    pendingApps: applications.filter(a => a.status === 'Pending').length,
    activeApps: applications.filter(a => ['Verified', 'Printing'].includes(a.status)).length,
    readyApps: applications.filter(a => a.status === 'Ready').length,
    totalUsers: users.length,
    officers: users.filter(u => u.role === 'officer' || u.role === 'admin').length,
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#292966]/30 border-t-[#292966] rounded-full animate-spin" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[rgba(74,74,74,0.12)] shadow-xl p-8 space-y-6 animate-fade-in-up text-[#4A4A4A]">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'rgba(109, 129, 150, 0.08)', border: '1px solid rgba(109, 129, 150, 0.2)' }}>
              <Lock className="w-6 h-6 text-[#292966]" />
            </div>
            <h2 className="text-xl font-bold text-[#4A4A4A]">Verifikasi Kredensial Admin</h2>
            <p className="text-xs text-[#777777] font-semibold">Halaman ini bersifat rahasia dan memerlukan otentikasi tambahan.</p>
          </div>

          {authError && (
            <div className="flex items-center gap-2 p-3 bg-[#E35336]/10 border border-[#E35336]/20 text-[#E35336] text-xs font-semibold rounded-xl animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4A4A4A] uppercase tracking-wide">Username Rahasia</label>
              <input
                type="text"
                required
                placeholder="Masukkan username admin"
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                className="input-field text-[#4A4A4A] placeholder:text-[#CBCBCB]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4A4A4A] uppercase tracking-wide">Password Keamanan</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="input-field text-[#4A4A4A] placeholder:text-[#CBCBCB]"
              />
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-[#FFFFE3] bg-[#4A4A4A] hover:bg-[#333333] border-none btn-glow transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Buka Akses Panel
              </button>
              
              {user ? (
                <a
                  href="/dashboard"
                  className="w-full py-3 rounded-xl font-bold bg-white border border-[rgba(74,74,74,0.12)] hover:bg-[#f8f8f0] text-[#777777] transition-all cursor-pointer text-sm text-center"
                >
                  Kembali ke Dashboard
                </a>
              ) : (
                <a
                  href="/login"
                  className="w-full py-3 rounded-xl font-bold bg-white border border-[rgba(74,74,74,0.12)] hover:bg-[#f8f8f0] text-[#777777] transition-all cursor-pointer text-sm text-center"
                >
                  Login sebagai Pengguna
                </a>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 text-[#4A4A4A]">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-[#4A4A4A] mb-1 font-normal">Panel Admin & Petugas</h1>
          <p className="text-[#777777] text-sm">Kelola seluruh permohonan paspor warga dan hak akses akun secara sentral.</p>
        </div>
        <button id="admin-refresh-btn" onClick={() => fetchData(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white border border-[rgba(74,74,74,0.12)] shadow-sm hover:bg-[#f8f8f0] transition-all disabled:opacity-50 cursor-pointer text-[#4A4A4A] self-start">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Memuat...' : 'Refresh Data'}
        </button>
      </div>

      {/* ── Stats Overview ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        {[
          { label: 'Total Warga Terdaftar', value: stats.totalUsers, color: '#292966', icon: Users },
          { label: 'Menunggu Verifikasi', value: stats.pendingApps, color: '#E35336', icon: Clock },
          { label: 'Sedang Diproses', value: stats.activeApps, color: '#6D8196', icon: Printer },
          { label: 'Selesai & Siap Diambil', value: stats.readyApps, color: '#519755', icon: Package },
        ].map((stat) => (
          <div key={stat.label} className="p-5 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#777777] font-bold uppercase tracking-wide">{stat.label}</p>
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            </div>
            <p className="text-3xl font-extrabold" style={{ color: stat.color }}>
              {loading ? <span className="skeleton w-8 h-8 inline-block rounded" /> : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────────── */}
      <div className="flex gap-2 p-1 bg-[rgba(74,74,74,0.04)] border border-[rgba(74,74,74,0.08)] rounded-xl max-w-sm animate-fade-in-up stagger-2">
        <button
          onClick={() => {
            setActiveTab('applications');
            router.push('/admin?tab=applications');
          }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'applications'
              ? 'bg-[#292966]/10 border border-[#292966]/20 text-[#292966]'
              : 'text-[#777777] hover:text-[#4A4A4A]'
          }`}
        >
          Permohonan ({stats.totalApps})
        </button>
        <button
          onClick={() => {
            setActiveTab('users');
            router.push('/admin?tab=users');
          }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#292966]/10 border border-[#292966]/20 text-[#292966]'
              : 'text-[#777777] hover:text-[#4A4A4A]'
          }`}
        >
          Pengguna ({stats.totalUsers})
        </button>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 skeleton rounded-2xl" />
          ))}
        </div>
      ) : activeTab === 'applications' ? (
        <div className="space-y-4 animate-fade-in">
          {/* Applications Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center p-4 bg-white border border-[rgba(74,74,74,0.12)] rounded-2xl shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777777]" />
              <input
                type="text"
                placeholder="Cari Nama Warga atau NIK..."
                value={appSearch}
                onChange={e => setAppSearch(e.target.value)}
                className="input-field pl-11 text-[#4A4A4A] placeholder:text-[#CBCBCB] bg-white border border-[rgba(74,74,74,0.15)]"
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="input-field cursor-pointer text-[#4A4A4A] bg-white border border-[rgba(74,74,74,0.15)]"
              >
                <option value="all" className="bg-white">Semua Status</option>
                <option value="Pending" className="bg-white">Menunggu Pembayaran</option>
                <option value="Verified" className="bg-white">Terverifikasi</option>
                <option value="Printing" className="bg-white">Dicetak</option>
                <option value="Ready" className="bg-white">Siap Diambil</option>
                <option value="Completed" className="bg-white">Selesai (Diambil)</option>
              </select>
            </div>
          </div>

          {/* Applications list */}
          {filteredApps.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm">
              <FileText className="w-12 h-12 text-[#777777] mx-auto mb-4" />
              <p className="text-[#777777] font-semibold">Tidak ada permohonan paspor yang ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredApps.map((app) => {
                const sc = statusConfig[app.status];
                return (
                  <div key={app.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm hover:border-[#6D8196] transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(109,129,150,0.08)', border: '1px solid rgba(109,129,150,0.2)' }}>
                        <sc.icon className="w-5 h-5 text-[#292966]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-base text-[#4A4A4A]">{app.full_name}</p>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${sc.className}`}>
                            {sc.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#777777] mt-1 font-semibold">NIK: <code>{app.nik}</code> · {new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        {app.queue_number && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#292966] bg-[#292966]/10 border border-[#292966]/20 rounded-md px-2 py-0.5 mt-1 font-bold">
                            <Check className="w-3 h-3" /> No. Antre: {app.queue_number}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#4A4A4A] hover:bg-[#f8f8f0] bg-white border border-[rgba(74,74,74,0.12)] transition-colors cursor-pointer"
                      >
                        Detail Berkas
                      </button>
                      
                      {sc.next && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, sc.next!)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#FFFFE3] bg-[#4A4A4A] hover:bg-[#333333] border-none btn-glow transition-all cursor-pointer"
                        >
                          {sc.nextLabel} →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {/* Users Search Toolbar */}
          <div className="flex p-4 bg-white border border-[rgba(74,74,74,0.12)] rounded-2xl shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777777]" />
              <input
                type="text"
                placeholder="Cari Pengguna berdasarkan Nama, Email, atau NIK..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="input-field pl-11 text-[#4A4A4A] placeholder:text-[#CBCBCB] bg-white border border-[rgba(74,74,74,0.15)]"
              />
            </div>
          </div>

          {/* Users List */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm">
              <Users className="w-12 h-12 text-[#777777] mx-auto mb-4" />
              <p className="text-[#777777] font-semibold">Tidak ada pengguna yang ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredUsers.map((u) => {
                const isUserAdmin = u.role === 'admin';
                const isUserOfficer = u.role === 'officer';
                
                return (
                  <div key={u.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm hover:border-[#6D8196] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: u.role === 'admin' ? 'linear-gradient(135deg, #E35336, #FCBB13)' : u.role === 'officer' ? 'linear-gradient(135deg, #292966, #6D8196)' : '#777777' }}>
                        {(u.full_name || u.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-[#4A4A4A]">{u.full_name || 'Belum mengisi profil'}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            u.role === 'admin' ? 'bg-[#E35336]/10 text-[#E35336] border border-[#E35336]/20' :
                            u.role === 'officer' ? 'bg-[#292966]/10 text-[#292966] border border-[#292966]/20' :
                            'bg-[rgba(74,74,74,0.04)] text-[#777777] border border-[rgba(74,74,74,0.08)]'
                          }`}>
                            {u.role}
                          </span>
                          {u.is_verified && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#519755]/10 text-[#519755] border border-[#519755]/20">
                              NIK OK
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#777777] font-semibold mt-0.5">{u.email}</p>
                        {u.nik && <p className="text-[11px] text-[#777777] font-mono mt-0.5">NIK: {u.nik}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <span className="text-xs text-[#777777] font-bold mr-1">Ubah Akses:</span>
                      
                      {u.role !== 'citizen' && (
                        <button
                          onClick={() => handleUpdateRole(u.id, 'citizen')}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-[rgba(74,74,74,0.12)] hover:bg-[#f8f8f0] text-[#777777] transition-colors cursor-pointer"
                        >
                          Citizen
                        </button>
                      )}
                      
                      {u.role !== 'officer' && (
                        <button
                          onClick={() => handleUpdateRole(u.id, 'officer')}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#292966]/10 border border-[#292966]/20 text-[#292966] hover:bg-[#292966]/20 transition-colors cursor-pointer"
                        >
                          Petugas
                        </button>
                      )}

                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleUpdateRole(u.id, 'admin')}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#E35336]/10 border border-[#E35336]/20 text-[#E35336] hover:bg-[#E35336]/20 transition-colors cursor-pointer"
                        >
                          Admin
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Application Detail Modal ────────────────────────────────────── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-[rgba(74,74,74,0.12)] shadow-2xl animate-fade-in-up stagger-1 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-[#4A4A4A]">Detail Berkas KTP & Permohonan</h3>
                <p className="text-xs text-[#777777] font-semibold mt-0.5">ID: <code>{selectedApp.id}</code></p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg hover:bg-[#f8f8f0] text-[#777777] hover:text-[#4A4A4A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm">
              {[
                { label: 'Nama Lengkap', value: selectedApp.full_name },
                { label: 'NIK Kependudukan', value: selectedApp.nik, isMono: true },
                { label: 'Tanggal Lahir', value: new Date(selectedApp.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Jenis Kelamin', value: selectedApp.gender },
                { label: 'Alamat Sesuai KTP', value: selectedApp.address },
                { label: 'Status Saat Ini', value: statusConfig[selectedApp.status].label, badge: true, className: statusConfig[selectedApp.status].className },
                { label: 'Nomor Antrean', value: selectedApp.queue_number || 'Belum check-in GPS' },
              ].map(f => (
                <div key={f.label} className="grid grid-cols-3 py-2.5 border-b border-[rgba(74,74,74,0.08)] items-start text-[#4A4A4A]">
                  <span className="text-xs text-[#777777] font-bold uppercase tracking-wide pt-0.5">{f.label}</span>
                  <span className="col-span-2 font-semibold text-[#4A4A4A] text-sm">
                    {f.badge ? (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${f.className}`}>{f.value}</span>
                    ) : f.isMono ? (
                      <code className="text-[#292966] font-bold">{f.value}</code>
                    ) : f.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedApp(null)}
                className="flex-1 py-3 rounded-xl font-bold bg-white border border-[rgba(74,74,74,0.12)] hover:bg-[#f8f8f0] text-[#777777] transition-all cursor-pointer text-sm"
              >
                Tutup Detail
              </button>
              
              {statusConfig[selectedApp.status].next && (
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedApp.id, statusConfig[selectedApp.status].next!);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-[#FFFFE3] bg-[#4A4A4A] hover:bg-[#333333] border-none btn-glow transition-all cursor-pointer text-sm"
                >
                  {statusConfig[selectedApp.status].nextLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#292966]/30 border-t-[#292966] rounded-full animate-spin" />
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  );
}
