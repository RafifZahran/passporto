'use client';

import { Shield, Zap, MapPin, Bell, ChevronRight, CheckCircle, Globe, Lock, ArrowRight, Star } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

const features = [
  { icon: Shield, title: 'Verifikasi NIK Otomatis', desc: 'Integrasi Dukcapil untuk validasi identitas real-time tanpa antri.', color: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
  { icon: Zap,    title: 'OCR Auto-Fill KTP',      desc: 'Upload foto KTP dan data terisi otomatis — tidak perlu ketik manual.', color: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  { icon: MapPin, title: 'Slot Predictor & Booking', desc: 'Lihat ketersediaan kuota real-time di semua Kanim Indonesia.', color: '#8b5cf6', glow: 'rgba(139,92,246,0.15)' },
  { icon: Bell,   title: 'Tracker Status Live',    desc: 'Notifikasi push setiap tahap: Pending → Verified → Cetak → Siap.', color: '#10b981', glow: 'rgba(16,185,129,0.15)' },
];

const steps = [
  { num: '01', title: 'Daftar & Verifikasi NIK', desc: 'Buat akun dan validasi identitas dengan NIK Dukcapil secara instan.', color: '#3b82f6' },
  { num: '02', title: 'Upload KTP & Auto-Fill',  desc: 'Foto KTP Anda diproses OCR — data terisi otomatis dalam 3 detik.', color: '#8b5cf6' },
  { num: '03', title: 'Pilih Kanim & Tanggal',   desc: 'Booking slot di kantor imigrasi terdekat sesuai jadwal Anda.', color: '#f59e0b' },
  { num: '04', title: 'Bayar & Ambil Antre',     desc: 'Pembayaran multi-channel & check-in berbasis GPS di lokasi.', color: '#10b981' },
];

const stats = [
  { value: '2.4M+', label: 'Pengguna Aktif' },
  { value: '98.7%', label: 'Uptime SLA' },
  { value: '<3 det', label: 'OCR Processing' },
  { value: '34 Kanim', label: 'Terintegrasi' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen mesh-bg relative text-slate-100 overflow-x-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* ── Floating Orbs ─────────────────────────────────────────────── */}
      <div className="orb orb-blue w-[600px] h-[600px] top-[-200px] left-[-200px] opacity-30" />
      <div className="orb orb-amber w-[400px] h-[400px] top-[40%] right-[-150px] opacity-25" />
      <div className="orb orb-violet w-[500px] h-[500px] bottom-[10%] left-[10%] opacity-20" />

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-8xl mx-auto">
        {/* Left Side: Logo */}
        <div className="flex-1 flex justify-start">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center animate-pulse-glow"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #f59e0b)' }}>
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
              <span className="gradient-text-blue">Pass</span><span className="text-slate-100">Porto</span>
            </span>
          </div>
        </div>

        {/* Center: Nav Links */}
        <div className="hidden md:flex items-center justify-center gap-1">
          {[
            { label: 'Fitur', href: '#features' },
            { label: 'Cara Kerja', href: '#steps' },
            { label: 'Tentang', href: '#about' }
          ].map(item => (
            <a key={item.label} href={item.href} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-100 transition-colors rounded-lg hover:bg-white/5">{item.label}</a>
          ))}
        </div>

        {/* Right Side: Auth Buttons */}
        <div className="flex-1 flex justify-end items-center gap-3">
          <a href="/login"
            className="hidden md:block px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
            Masuk
          </a>
          <a href="/register"
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl btn-glow transition-all"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            Mulai Gratis
          </a>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 text-center px-6 pt-32 pb-28 max-w-7xl mx-auto">


        {/* Headline */}
        <h1 className="text-6xl md:text-8xl font-black leading-[1.05] tracking-tight mb-6 animate-fade-in-up"
          style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
          Urus Paspor{' '}
          <span className="gradient-text">Tanpa Ribet</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-4xl mx-auto mb-12 animate-fade-in-up stagger-1 leading-relaxed">
          PassPorto menggantikan sistem lama yang penuh antrian dan ghost quota.
          Semua proses kini digital, transparan, dan real-time.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 animate-fade-in-up stagger-2">
          <a href="/register" id="cta-register-btn"
            className="flex items-center gap-2 px-8 py-4 text-base font-bold text-white rounded-2xl btn-glow transition-all group"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            Mulai Permohonan
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
          <a href="/login" id="cta-login-btn"
            className="flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-2xl border border-white/12 hover:border-white/20 hover:bg-white/5 text-slate-200 transition-all">
            Sudah Punya Akun
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 animate-fade-in stagger-3">
          {['Terintegrasi Dukcapil', 'Enkripsi End-to-End', 'Gratis untuk WNI'].map(t => (
            <span key={t} className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />{t}
            </span>
          ))}
        </div>
      </section>

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-20 max-w-7xl mx-auto">
        <ScrollReveal animation="fade-in-up" delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={s.label}
                className="glass-card rounded-2xl p-6 text-center"
                style={{ animationDelay: `${i * 0.08}s` }}>
                <p className="text-2xl md:text-3xl font-black gradient-text-blue mb-1"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</p>
                <p className="text-xs text-slate-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 px-6 md:px-12 py-24 max-w-8xl mx-auto">
        <div className="divider mb-16" />
        <ScrollReveal animation="fade-in-up" delay={100}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4"
              style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
              Solusi untuk <span className="gradient-text">Setiap Masalah</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">
              4 masalah utama sistem lama. 4 solusi spesifik yang kami bangun.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} animation="fade-in-up" delay={150 + i * 120}>
              <div className="glass-card rounded-2xl p-6 h-full group cursor-default">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: f.glow, border: `1px solid ${f.color}30` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="text-sm font-bold mb-2 text-slate-100">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>

                {/* Hover glow line */}
                <div className="mt-5 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, ${f.color}, transparent)` }} />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Steps ─────────────────────────────────────────────────────── */}
      <section id="steps" className="relative z-10 px-6 py-24 max-w-7xl mx-auto">
        <div className="divider mb-16" />
        <ScrollReveal animation="fade-in-up" delay={100}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight"
              style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
              Selesai dalam <span className="gradient-text">4 Langkah</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {steps.map((s, i) => (
            <ScrollReveal key={s.num} animation="fade-in-up" delay={150 + i * 130} className="h-full">
              <div className="glass-card rounded-2xl p-7 flex gap-5 h-full group">
                {/* Number */}
                <div className="flex-shrink-0 text-4xl font-black leading-none"
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    background: `linear-gradient(135deg, ${s.color}, transparent)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                  {s.num}
                </div>
                <div>
                  <h3 className="font-bold mb-2 text-slate-100 text-base">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Tentang (About) ────────────────────────────────────────────── */}
      <section id="about" className="relative z-10 px-6 md:px-12 py-24 max-w-8xl mx-auto">
        <div className="divider mb-16" />
        <ScrollReveal animation="fade-in-up" delay={100}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Info */}
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight"
                style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
                Membawa Pengurusan Paspor ke <span className="gradient-text">Era Modern</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                PassPorto lahir sebagai solusi atas antrean fisik yang melelahkan dan transparansi kuota yang minim. Kami mengintegrasikan teknologi terkini untuk menciptakan layanan permohonan paspor Indonesia secara digital, transparan, dan aman bagi seluruh warga negara.
              </p>
              
              {/* Point Lists */}
              <div className="space-y-4 pt-2">
                {[
                  { title: 'Verifikasi NIK Secara Instan', desc: 'Terintegrasi langsung dengan database kependudukan nasional untuk proses verifikasi data yang aman dan cepat.' },
                  { title: 'Transparansi Penuh Slot Kuota', desc: 'Sistem alokasi transparan yang memantau ketersediaan slot di seluruh Kantor Imigrasi (Kanim) secara real-time.' },
                  { title: 'Pemrosesan Cepat Berbasis AI', desc: 'Pemindaian dokumen otomatis dengan teknologi OCR untuk meminimalkan pengisian formulir secara manual.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-base">{item.title}</h4>
                      <p className="text-sm text-slate-400 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Interactive Graphic */}
            <div className="relative group">
              {/* Backglow Orb */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-amber-500/10 blur-3xl opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none duration-500" />
              
              {/* Image Container with premium details */}
              <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-950/40 backdrop-blur-xl p-3 shadow-2xl transition-all duration-500 group-hover:border-blue-500/30 group-hover:shadow-[0_0_50px_rgba(59,130,246,0.15)]">
                <img 
                  src="/digital_passport_mockup.png" 
                  alt="PassPorto Digital Mockup" 
                  className="w-full h-auto rounded-2xl object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <section id="cta" className="relative z-10 px-6 py-16 max-w-6xl mx-auto mb-20">
        <ScrollReveal animation="scale-up" delay={100}>
          <div className="relative rounded-3xl p-12 text-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(245,158,11,0.08) 100%)', border: '1px solid rgba(59,130,246,0.2)' }}>
            {/* Inner glow */}
            <div className="absolute inset-0 rounded-3xl"
              style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(59,130,246,0.1), transparent)' }} />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.1))', border: '1px solid rgba(59,130,246,0.3)' }}>
                <Lock className="w-7 h-7 text-blue-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Siap Urus Paspor Anda?
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto text-lg">
                Buat akun dalam 60 detik dan mulai permohonan paspor tanpa repot.
              </p>
              <a href="/register"
                className="inline-flex items-center gap-2 px-9 py-4 text-base font-bold text-white rounded-2xl btn-glow transition-all group"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                Daftar Gratis Sekarang
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/8 py-10 px-6 md:px-12">
        <div className="max-w-8xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #f59e0b)' }}>
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-300" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>PassPorto</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 PassPorto — Sistem Paspor Digital Indonesia</p>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-slate-500 text-xs">Dibuat untuk warga negara Indonesia</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
