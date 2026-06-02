'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Globe, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const perks = [
  { icon: Shield,       text: 'Verifikasi NIK Real-Time' },
  { icon: CheckCircle,  text: 'Integrasi Dukcapil Resmi' },
  { icon: Lock,         text: 'Enkripsi End-to-End' },
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
    <div className="min-h-screen mesh-bg flex text-slate-100 overflow-hidden">
      {/* Orbs */}
      <div className="orb orb-blue  w-[500px] h-[500px] top-[-150px] left-[-150px] opacity-30" />
      <div className="orb orb-amber w-[350px] h-[350px] bottom-[-100px] right-[30%] opacity-20" />
      <div className="noise-overlay" />

      {/* ── Left Panel (Branding) ──────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 relative z-10 p-12 border-r border-white/8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #f59e0b)' }}>
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <span className="gradient-text-blue">Pass</span><span className="text-slate-100">Porto</span>
          </span>
        </div>

        {/* Center content */}
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 leading-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Selamat Datang{' '}
            <span className="gradient-text">Kembali</span>
          </h2>
          <p className="text-slate-400 text-base mb-10 leading-relaxed">
            Masuk ke akun Anda dan lanjutkan proses permohonan paspor yang lebih mudah dan cepat.
          </p>

          {/* Perks */}
          <div className="space-y-4">
            {perks.map(p => (
              <div key={p.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p.icon className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm text-slate-300 font-medium">{p.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer quote */}
        <div className="glass-card rounded-2xl p-5">
          <p className="text-slate-400 text-sm italic leading-relaxed">
            "PassPorto membuat proses paspor saya jadi 10x lebih cepat. Tidak perlu antri berjam-jam lagi."
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #f59e0b)' }}>A</div>
            <span className="text-xs text-slate-400 font-medium">Warga Jakarta Selatan</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #f59e0b)' }}>
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <span className="gradient-text-blue">Pass</span><span className="text-slate-100">Porto</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-black tracking-tight mb-2"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Masuk ke Akun</h1>
            <p className="text-slate-400 text-sm">Belum punya akun?{' '}
              <Link href="/register" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">Daftar gratis</Link>
            </p>
          </div>

          {/* Form card */}
          <div className="glass rounded-3xl p-8 border border-white/8">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl mb-6 text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input id="login-email" type="email" placeholder="nama@example.com" required
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="input-field pl-11" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input id="login-password" type={showPass ? 'text' : 'password'} placeholder="••••••••" required
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="input-field pl-11 pr-11" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button id="login-submit-btn" type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 btn-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer mt-2"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>Masuk</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
