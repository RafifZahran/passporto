'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, Zap, Shield, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import TermsModal from '@/components/TermsModal';

const passwordRules = [
  { label: '8+ karakter',  check: (p: string) => p.length >= 8 },
  { label: 'Huruf kapital', check: (p: string) => /[A-Z]/.test(p) },
  { label: 'Angka',        check: (p: string) => /\d/.test(p) },
];

const benefits = [
  { icon: Zap,    text: 'OCR KTP Otomatis', sub: 'Isi data dalam hitungan detik' },
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
      <div className="min-h-screen flex" style={{ background: '#ffffff', color: '#4A4A4A' }}>

        {/* ── Left Panel ────────────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between w-[440px] flex-shrink-0 p-12"
          style={{ background: '#4A4A4A' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span className="text-xl" style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#FFFFE3' }}>
              PassPorto
            </span>
          </Link>

          <div>
            <h2 className="text-3xl md:text-4xl mb-4 leading-tight"
              style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#FFFFE3', fontWeight: 400 }}>
              Mulai Perjalanan{' '}
              <em style={{ fontStyle: 'italic', color: '#6D8196' }}>Digital Anda</em>
            </h2>
            <p className="text-sm mb-10 leading-relaxed" style={{ color: '#CBCBCB' }}>
              Bergabung dengan jutaan warga Indonesia yang sudah menikmati kemudahan pengurusan paspor digital.
            </p>

            {/* Benefits */}
            <div className="space-y-3">
              {benefits.map(b => (
                <div key={b.text} className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,227,0.05)', border: '1px solid rgba(255,255,227,0.08)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(109,129,150,0.25)', border: '1px solid rgba(109,129,150,0.4)' }}>
                    <b.icon className="w-4 h-4" style={{ color: '#6D8196' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#FFFFE3' }}>{b.text}</p>
                    <p className="text-xs" style={{ color: '#aaaaaa' }}>{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[['2.4M+', 'Pengguna'], ['99%', 'Uptime'], ['<3det', 'OCR']].map(([v, l]) => (
              <div key={l} className="p-4 text-center rounded-xl"
                style={{ background: 'rgba(255,255,227,0.05)', border: '1px solid rgba(255,255,227,0.08)' }}>
                <p className="text-lg font-light mb-0.5" style={{ fontFamily: 'DM Serif Display, serif', color: '#FFFFE3' }}>{v}</p>
                <p className="text-xs" style={{ color: '#aaaaaa' }}>{l}</p>
              </div>
            ))}
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
                Buat Akun Baru
              </h1>
              <p className="text-sm" style={{ color: '#aaaaaa' }}>
                Sudah punya akun?{' '}
                <Link href="/login" className="font-medium" style={{ color: '#6D8196', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  Masuk
                </Link>
              </p>
            </div>

            <div className="p-8 rounded-2xl" style={{ background: '#ffffff', border: '1px solid rgba(74,74,74,0.12)' }}>
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl mb-6 text-sm"
                  style={{ background: 'rgba(184,80,80,0.06)', border: '1px solid rgba(184,80,80,0.2)', color: '#b85050' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

              <form id="register-form" onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#777777' }}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBCBCB' }} />
                    <input id="register-email" type="email" placeholder="nama@example.com" required
                      value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="input-field pl-11" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#777777' }}>Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBCBCB' }} />
                    <input id="register-password" type={showPass ? 'text' : 'password'} placeholder="••••••••" required
                      value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                      className="input-field pl-11 pr-11" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: '#CBCBCB' }}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="flex gap-3 mt-3">
                      {passwordRules.map(rule => (
                        <span key={rule.label} className="flex items-center gap-1 text-xs">
                          <CheckCircle className="w-3 h-3" style={{ color: rule.check(form.password) ? '#5a8a6a' : '#CBCBCB' }} />
                          <span style={{ color: rule.check(form.password) ? '#5a8a6a' : '#CBCBCB' }}>{rule.label}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: '#777777' }}>Konfirmasi Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#CBCBCB' }} />
                    <input id="register-confirm" type="password" placeholder="••••••••" required
                      value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
                      className="input-field pl-11" />
                  </div>
                </div>

                {/* Submit */}
                <button id="register-submit-btn" type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 btn-glow disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: '#4A4A4A', color: '#FFFFE3' }}>
                  {loading
                    ? <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderTopColor: '#FFFFE3', borderColor: 'rgba(255,255,227,0.3)' }} />
                    : <><span>Daftar Sekarang</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-center text-xs mt-6" style={{ color: '#aaaaaa' }}>
                Dengan mendaftar, Anda menyetujui{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="cursor-pointer font-medium"
                  style={{ color: '#6D8196', textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none', padding: 0 }}
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
