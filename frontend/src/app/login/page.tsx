'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const perks = [
  { icon: Shield,      text: 'Verifikasi NIK Real-Time' },
  { icon: CheckCircle, text: 'Integrasi Dukcapil Resmi' },
  { icon: Lock,        text: 'Enkripsi End-to-End' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#ffffff', color: '#4A4A4A' }}>

      {/* ── Left Panel (Branding) ──────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] flex-shrink-0 relative p-12"
        style={{ background: '#4A4A4A' }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span className="text-xl" style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#FFFFE3' }}>
            PassPorto
          </span>
        </Link>

        {/* Center content */}
        <div>
          <h2 className="text-3xl md:text-4xl mb-4 leading-tight"
            style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#FFFFE3', fontWeight: 400 }}>
            Selamat Datang{' '}
            <em style={{ fontStyle: 'italic', color: '#6D8196' }}>Kembali</em>
          </h2>
          <p className="text-sm mb-10 leading-relaxed" style={{ color: '#CBCBCB' }}>
            Masuk ke akun Anda dan lanjutkan proses permohonan paspor yang lebih mudah dan cepat.
          </p>

          {/* Perks */}
          <div className="space-y-4">
            {perks.map(p => (
              <div key={p.text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(109,129,150,0.25)', border: '1px solid rgba(109,129,150,0.4)' }}>
                  <p.icon className="w-3.5 h-3.5" style={{ color: '#6D8196' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: '#CBCBCB' }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer quote */}
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,227,0.06)', border: '1px solid rgba(255,255,227,0.1)' }}>
          <p className="text-sm italic leading-relaxed" style={{ color: '#CBCBCB' }}>
            "PassPorto membuat proses paspor saya jadi 10× lebih cepat. Tidak perlu antri berjam-jam lagi."
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: '#6D8196', color: '#FFFFE3' }}>R</div>
            <span className="text-xs" style={{ color: '#aaaaaa' }}>Warga Jakarta Selatan</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in-up">

          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden" style={{ textDecoration: 'none' }}>
            <span className="text-xl" style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#4A4A4A' }}>
              PassPorto
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl mb-2"
              style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#4A4A4A', fontWeight: 400 }}>
              Masuk ke Akun
            </h1>
            <p className="text-sm" style={{ color: '#aaaaaa' }}>
              Belum punya akun?{' '}
              <Link href="/register" className="font-medium" style={{ color: '#6D8196', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                Daftar gratis
              </Link>
            </p>
          </div>

          {/* Form card */}
          <div className="p-8 rounded-2xl" style={{ background: '#ffffff', border: '1px solid rgba(74,74,74,0.12)' }}>

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl mb-6 text-sm"
                style={{ background: 'rgba(184,80,80,0.06)', border: '1px solid rgba(184,80,80,0.2)', color: '#b85050' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#777777' }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBCBCB' }} />
                  <input id="login-email" type="email" placeholder="nama@example.com" required
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="input-field pl-11" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#777777' }}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBCBCB' }} />
                  <input id="login-password" type={showPass ? 'text' : 'password'} placeholder="••••••••" required
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="input-field pl-11 pr-11" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#CBCBCB' }}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button id="login-submit-btn" type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 btn-glow disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#4A4A4A', color: '#FFFFE3' }}>
                {loading
                  ? <div className="w-5 h-5 border-2 border-cream/30 border-t-white rounded-full animate-spin" style={{ borderTopColor: '#FFFFE3', borderColor: 'rgba(255,255,227,0.3)' }} />
                  : <><span>Masuk</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
