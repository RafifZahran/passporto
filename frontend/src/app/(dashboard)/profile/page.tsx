'use client';

import { useState, useRef, useEffect } from 'react';
import { Shield, Fingerprint, CheckCircle, AlertCircle, Loader2, User, Mail, Edit3, Save, X, Laptop, History, Key } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { authApi } from '@/lib/api';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [nik, setNik] = useState('');
  const [nikLoading, setNikLoading] = useState(false);
  const [nikResult, setNikResult] = useState<{ is_valid: boolean; full_name?: string; message: string } | null>(null);

  // ── Name editing state ──
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const startEditingName = () => {
    setEditName(user?.full_name || '');
    setIsEditingName(true);
    setNameError('');
    setNameSuccess(false);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditName('');
    setNameError('');
  };

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setNameError('Nama tidak boleh kosong.');
      return;
    }
    if (trimmed === user?.full_name) {
      setIsEditingName(false);
      return;
    }

    setNameLoading(true);
    setNameError('');
    try {
      await authApi.updateProfile(trimmed);
      await refreshUser();
      setIsEditingName(false);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err: any) {
      setNameError(err.response?.data?.error || 'Gagal menyimpan nama.');
    } finally {
      setNameLoading(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') cancelEditingName();
  };

  const handleValidateNIK = async (e: React.FormEvent) => {
    e.preventDefault();
    setNikLoading(true);
    setNikResult(null);
    try {
      const res = await authApi.validateNIK(nik);
      setNikResult(res.data);
      if (res.data.is_valid) {
        // Refresh user in context so sidebar verification badge updates immediately
        await refreshUser();
      }
    } catch (err: any) {
      setNikResult({ is_valid: false, message: err.response?.data?.error || 'Verifikasi gagal.' });
    } finally {
      setNikLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 text-slate-100">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold mb-1 text-slate-100">Profil & Verifikasi NIK</h1>
        <p className="text-slate-350 text-sm font-medium">Kelola informasi akun dan verifikasi identitas nasional Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Info Card */}
        <div className="space-y-6 animate-fade-in-up stagger-1">
          <div className="p-6 rounded-2xl card-gradient border border-slate-800 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #097DE9, #FCBB13)' }}>
                {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={nameInputRef}
                      id="edit-name-input"
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={handleNameKeyDown}
                      disabled={nameLoading}
                      className="input-field text-xs font-semibold py-1.5 px-3 text-slate-100"
                      style={{ maxWidth: '120px' }}
                      placeholder="Nama lengkap..."
                    />
                    <button
                      id="save-name-btn"
                      onClick={handleSaveName}
                      disabled={nameLoading}
                      className="p-2 rounded-lg hover:bg-slate-800 text-emerald-400 hover:text-emerald-350 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Simpan"
                    >
                      {nameLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    <button
                      id="cancel-name-btn"
                      onClick={cancelEditingName}
                      disabled={nameLoading}
                      className="p-2 rounded-lg hover:bg-slate-800 text-red-400 hover:text-red-350 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Batal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-base text-slate-100 truncate max-w-[130px]" title={user?.full_name || ''}>
                      {user?.full_name || 'Nama belum diisi'}
                    </p>
                    <button
                      id="edit-name-btn"
                      onClick={startEditingName}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                      title="Edit Nama"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {nameSuccess && (
                      <span className="text-[10px] text-emerald-400 animate-fade-in flex items-center gap-0.5 font-semibold">
                        <CheckCircle className="w-3 h-3" /> Tersimpan!
                      </span>
                    )}
                  </div>
                )}
                {nameError && (
                  <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {nameError}
                  </p>
                )}
                <p className="text-slate-350 text-xs flex items-center gap-1.5 mt-0.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-450 flex-shrink-0" />{user?.email}
                </p>
              </div>
            </div>

            {/* Profile details list */}
            <div className="space-y-3 text-sm">
              {[
                { label: 'NIK', value: user?.nik || 'Belum diverifikasi', icon: Fingerprint },
                { label: 'Nama Lengkap', value: user?.full_name || '—', icon: User },
                { label: 'Role', value: user?.role || 'citizen', icon: Shield },
                { label: 'Status Akun', value: user?.is_verified ? 'Terverifikasi' : 'Belum Terverifikasi', icon: CheckCircle },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{item.label}</p>
                      <p className={`font-semibold text-xs mt-0.5 ${item.label === 'Status Akun' && user?.is_verified ? 'text-emerald-400 font-bold' : 'text-slate-200'}`}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sesi & Aktivitas Login */}
          <div className="p-6 rounded-2xl card-gradient border border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" /> Sesi & Aktivitas Login
            </h3>
            <p className="text-xs text-slate-350 font-medium">Pantau masuknya akun dan sesi aktif perangkat Anda.</p>
            
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Laptop className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-200 truncate">Chrome di Windows</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Jakarta, ID · Sesi Aktif
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-200 truncate">Kata Sandi Diubah</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">2 hari yang lalu</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-450 flex-shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-200 truncate">Pendaftaran Akun</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">25 Mei 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Verification & Security info */}
        <div className="lg:col-span-2 space-y-6 animate-fade-in-up stagger-2">
          {/* NIK Verification Card */}
          <div className="p-6 rounded-2xl card-gradient border border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(9,125,233,0.08)', border: '1px solid rgba(9,125,233,0.2)' }}>
                <Fingerprint className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-slate-100 text-sm">Verifikasi NIK (e-KYC)</h2>
                <p className="text-xs text-slate-350">Terintegrasi dengan database Dukcapil (mock)</p>
              </div>
              {user?.is_verified && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full status-ready flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Sudah Terverifikasi
                </span>
              )}
            </div>

            {!user?.is_verified ? (
              <form id="nik-verify-form" onSubmit={handleValidateNIK} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                    Nomor Induk Kependudukan (NIK)
                  </label>
                  <input
                    id="nik-input"
                    type="text"
                    placeholder="Contoh: 3201010101010001"
                    maxLength={16}
                    required
                    value={nik}
                    onChange={e => setNik(e.target.value.replace(/\D/g, ''))}
                    className="input-field font-mono text-lg tracking-widest text-slate-100"
                  />
                  <p className="text-xs text-slate-400 mt-2 font-medium">{nik.length}/16 digit</p>
                </div>

                {/* Mock NIK hint */}
                <div className="p-4 rounded-xl text-xs space-y-1"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
                  <p className="font-bold text-blue-400 mb-2">🧪 NIK untuk pengujian:</p>
                  {[
                    ['3201010101010001', 'Budi Santoso'],
                    ['3271010203040002', 'Siti Rahayu'],
                    ['3175052504900003', 'Ahmad Fauzi'],
                  ].map(([nikVal, name]) => (
                    <button key={nikVal} type="button" onClick={() => setNik(nikVal)}
                      className="flex items-center gap-3 w-full text-left hover:bg-slate-800 rounded-lg px-2 py-1.5 transition-colors cursor-pointer text-slate-300">
                      <code className="text-blue-400 font-bold font-mono">{nikVal}</code>
                      <span className="text-slate-350 font-medium">→ {name}</span>
                    </button>
                  ))}
                </div>

                <button id="nik-submit-btn" type="submit" disabled={nikLoading || nik.length !== 16}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white btn-glow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
                  style={{ background: 'linear-gradient(135deg, #097DE9, #FCBB13)' }}>
                  {nikLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Memverifikasi...</>
                    : <><Shield className="w-4 h-4" />Verifikasi NIK</>}
                </button>
              </form>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="p-4 rounded-xl flex items-center gap-3 text-sm animate-fade-in"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-400">Identitas NIK Terverifikasi</p>
                    <p className="text-slate-350 text-xs mt-0.5 font-medium">Koneksi e-KYC Dukcapil aktif dan valid.</p>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <p className="font-bold text-slate-200 text-xs tracking-wide">Data Terdaftar Dukcapil</p>
                    <span className="text-[10px] bg-blue-500/10 border border-blue-500/35 text-blue-400 px-2 py-0.5 rounded font-bold uppercase">
                      KTP-el Aktif
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                    <div>
                      <p className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Nomor NIK</p>
                      <p className="text-slate-200 font-mono font-bold text-sm mt-1 tracking-wider">{user?.nik}</p>
                    </div>
                    <div>
                      <p className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Nama Lengkap KTP</p>
                      <p className="text-slate-200 font-bold mt-1">{user?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Penyedia Sertifikat</p>
                      <p className="text-slate-200 font-bold mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        Pusdatin Dukcapil RI
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Metode Verifikasi</p>
                      <p className="text-slate-200 font-bold mt-1">Biometrik & Data NIK</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Result */}
            {nikResult && (
              <div className={`mt-4 flex items-start gap-3 p-4 rounded-xl text-sm animate-fade-in`}
                style={nikResult.is_valid
                  ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }
                  : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {nikResult.is_valid
                  ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  : <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                <div>
                  {nikResult.is_valid && nikResult.full_name && (
                    <p className="font-bold text-emerald-400 mb-1">Selamat datang, {nikResult.full_name}!</p>
                  )}
                  <p className="font-semibold">{nikResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Security Banner Card */}
          <div className="p-6 rounded-2xl card-gradient border border-slate-800 space-y-4">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" /> Keamanan & Privasi Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h4 className="font-bold text-slate-200">Enkripsi Data KTP</h4>
                <p className="text-slate-450 leading-relaxed">
                  Seluruh data NIK dan dokumen identitas Anda disimpan dan ditransmisikan dalam format enkripsi AES-256 bit untuk menjamin keamanan informasi Anda.
                </p>
              </div>
              <div className="p-4 rounded-xl space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h4 className="font-bold text-slate-200">Koneksi e-KYC Dukcapil</h4>
                <p className="text-slate-450 leading-relaxed">
                  Verifikasi NIK dilakukan secara instan melalui integrasi *mock* dengan server terenkripsi Dukcapil tanpa menyimpan salinan KTP fisik di cache.
                </p>
              </div>
              <div className="p-4 rounded-xl space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h4 className="font-bold text-slate-200">Regulasi Privasi PDP</h4>
                <p className="text-slate-450 leading-relaxed">
                  PassPorto sepenuhnya mematuhi Undang-Undang Pelindungan Data Pribadi (PDP) Indonesia guna memastikan bahwa informasi Anda dirahasiakan dengan ketat.
                </p>
              </div>
              <div className="p-4 rounded-xl space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <h4 className="font-bold text-slate-200">Penghapusan Cache Berkas</h4>
                <p className="text-slate-450 leading-relaxed">
                  Semua data mentah hasil *scanning* KTP dihapus secara otomatis dari memori server sesaat setelah status e-KYC Anda terverifikasi di sistem.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
