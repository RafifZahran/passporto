'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Globe, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, Zap, Shield, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import TermsModal from '@/components/TermsModal';

const passwordRules = [
  { label: '8+ karakter',  check: (p: string) => p.length >= 8 },
  { label: 'Huruf kapital', check: (p: string) => /[A-Z]/.test(p) },
  { label: 'Angka',        check: (p: string) => /\d/.test(p) },
];

const benefits = [
  { icon: Zap,    text: 'OCR KTP Otomatis', sub: 'Isi data dalam 3 detik' },
  { icon: Shield, text: 'Verifikasi NIK',   sub: 'Terintegrasi Dukcapil' },
  { icon: Star,   text: 'Gratis Selamanya', sub: 'Untuk seluruh WNI' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTerms, setShowTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Password tidak cocok.'); return; }
    if (form.password.length < 8) { setError('Password minimal 8 karakter.'); return; }
    setLoading(true);
    try {
      await register(form.email, form.password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="min-h-screen mesh-bg flex text-slate-100 overflow-hidden">
      {/* Orbs */}
      <div className="orb orb-violet w-[500px] h-[500px] top-[-150px] right-[-100px] opacity-25" />
      <div className="orb orb-blue  w-[400px] h-[400px] bottom-[-100px] left-[20%] opacity-20" />
      <div className="noise-overlay" />

      {/* ── Left Panel ────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 relative z-10 p-12 border-r border-white/8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #f59e0b)' }}>
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <span className="gradient-text-blue">Pass</span><span className="text-slate-100">Porto</span>
          </span>
        </Link>

        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 leading-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Mulai Perjalanan{' '}
            <span className="gradient-text">Digital Anda</span>
          </h2>
          <p className="text-slate-400 text-base mb-10 leading-relaxed">
            Bergabung dengan jutaan warga Indonesia yang sudah menikmati kemudahan pengurusan paspor digital.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {benefits.map(b => (
              <div key={b.text} className="flex items-center gap-4 glass-card rounded-xl p-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <b.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-100">{b.text}</p>
                  <p className="text-xs text-slate-400">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[['2.4M+', 'Pengguna'], ['99%', 'Uptime'], ['<3det', 'OCR']].map(([v, l]) => (
            <div key={l} className="glass-card rounded-xl p-4 text-center">
              <p className="text-lg font-black gradient-text-blue" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{v}</p>
              <p className="text-xs text-slate-400 mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel (Form) ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #f59e0b)' }}>
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <span className="gradient-text-blue">Pass</span><span className="text-slate-100">Porto</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-black tracking-tight mb-2"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Buat Akun Baru</h1>
            <p className="text-slate-400 text-sm">Sudah punya akun?{' '}
              <Link href="/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">Masuk</Link>
            </p>
          </div>

          <div className="glass rounded-3xl p-8 border border-white/8">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl mb-6 text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            <form id="register-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input id="register-email" type="email" placeholder="nama@example.com" required
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="input-field pl-11" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input id="register-password" type={showPass ? 'text' : 'password'} placeholder="••••••••" required
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="input-field pl-11 pr-11" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="flex gap-3 mt-3">
                    {passwordRules.map(rule => (
                      <span key={rule.label} className="flex items-center gap-1 text-xs">
                        <CheckCircle className={`w-3 h-3 ${rule.check(form.password) ? 'text-emerald-400' : 'text-slate-600'}`} />
                        <span className={rule.check(form.password) ? 'text-emerald-400 font-medium' : 'text-slate-500'}>{rule.label}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Konfirmasi Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input id="register-confirm" type="password" placeholder="••••••••" required
                    value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
                    className="input-field pl-11" />
                </div>
              </div>

              {/* Submit */}
              <button id="register-submit-btn" type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 btn-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer mt-2"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><span>Daftar Sekarang</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-6">
              Dengan mendaftar, Anda menyetujui{' '}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-blue-400 cursor-pointer hover:underline font-semibold hover:text-blue-300 transition-colors"
              >
                Syarat & Ketentuan
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
    {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </>
  );
}
