'use client';

import Link from 'next/link';
import {
  Shield, Zap, MapPin, Bell, CheckCircle, ArrowRight,
  LayoutDashboard, FileText, CreditCard, User, Plus,
  ChevronRight, Clock, Package, Printer
} from 'lucide-react';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import ScrollReveal from '@/components/ScrollReveal';

const features = [
  {
    num: '01',
    icon: Shield,
    title: 'Verifikasi NIK Otomatis',
    desc: 'Integrasi Dukcapil untuk validasi identitas real-time tanpa antri.',
  },
  {
    num: '02',
    icon: Zap,
    title: 'OCR Auto-Fill KTP',
    desc: 'Upload foto KTP dan data terisi otomatis — tidak perlu ketik manual.',
  },
  {
    num: '03',
    icon: MapPin,
    title: 'Slot Predictor & Booking',
    desc: 'Lihat ketersediaan kuota real-time di semua Kanim Indonesia.',
  },
  {
    num: '04',
    icon: Bell,
    title: 'Tracker Status Live',
    desc: 'Notifikasi setiap tahap: Pending → Verified → Cetak → Siap Ambil.',
  },
];

const steps = [
  { num: '01', title: 'Daftar & Verifikasi NIK', desc: 'Buat akun dan validasi identitas dengan NIK Dukcapil secara instan.' },
  { num: '02', title: 'Upload KTP & Auto-Fill',  desc: 'Foto KTP diproses OCR — data terisi otomatis dalam hitungan detik.' },
  { num: '03', title: 'Pilih Kanim & Tanggal',   desc: 'Booking slot di kantor imigrasi terdekat sesuai jadwal Anda.' },
  { num: '04', title: 'Bayar & Check-in',         desc: 'Pembayaran multi-channel & check-in berbasis GPS di lokasi.' },
];

const stats = [
  { value: '2.4M+', label: 'Pengguna Aktif' },
  { value: '98.7%', label: 'Uptime SLA' },
  { value: '<3 det', label: 'OCR Processing' },
  { value: '34 Kanim', label: 'Terintegrasi' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: '#ffffff', color: '#4A4A4A' }}>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center px-6 md:px-16 py-4"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(74,74,74,0.1)' }}
      >
        {/* Logo — flex-1 kiri */}
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <span className="text-xl tracking-tight" style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#4A4A4A' }}>
              PassPorto
            </span>
          </Link>
        </div>

        {/* Center nav — center */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Fitur', href: '#features' },
            { label: 'Cara Kerja', href: '#steps' },
            { label: 'Tentang', href: '#about' },
          ].map(item => (
            <a key={item.label} href={item.href} className="nav-link">{item.label}</a>
          ))}
        </div>

        {/* Auth buttons — flex-1 kanan */}
        <div className="flex-1 flex items-center justify-end gap-3">
          <Link href="/login"
            className="hidden md:inline-flex px-4 py-2 text-sm font-medium rounded-full transition-all"
            style={{ color: '#4A4A4A', border: '1px solid rgba(74,74,74,0.25)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#4A4A4A';
              (e.currentTarget as HTMLAnchorElement).style.color = '#FFFFE3';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
              (e.currentTarget as HTMLAnchorElement).style.color = '#4A4A4A';
            }}
          >
            Masuk
          </Link>
          <Link href="/register"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-full transition-all btn-glow"
            style={{ background: '#4A4A4A', color: '#FFFFE3' }}
          >
            Mulai Gratis <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero with ContainerScroll ──────────────────────────────────────── */}
      <ContainerScroll
        titleComponent={
          <div className="animate-fade-in-up">
            {/* Tag */}
            <span className="tag-label mb-6 inline-block">Layanan Paspor Digital</span>

            {/* Headline */}
            <h1 className="heading-display text-5xl md:text-7xl lg:text-8xl mb-6 mt-4"
              style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontWeight: 400, lineHeight: 1.06, letterSpacing: '-0.02em', color: '#4A4A4A' }}>
              Urus Paspor{' '}
              <em style={{ fontStyle: 'italic', color: '#6D8196' }}>Tanpa Ribet</em>
            </h1>

            {/* Sub */}
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in stagger-1"
              style={{ color: '#777777', fontFamily: 'DM Sans, sans-serif', fontWeight: 300 }}>
              PassPorto menggantikan sistem lama yang penuh antrian dan ghost quota.
              Semua proses kini digital, transparan, dan real-time.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 animate-fade-in stagger-2">
              <Link href="/register" id="cta-register-btn"
                className="flex items-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-full btn-glow transition-all group"
                style={{ background: '#4A4A4A', color: '#FFFFE3' }}>
                Mulai Permohonan
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/login" id="cta-login-btn"
                className="flex items-center gap-2 px-7 py-3.5 text-sm font-medium rounded-full transition-all"
                style={{ color: '#4A4A4A', border: '1px solid rgba(74,74,74,0.3)' }}>
                Sudah Punya Akun
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs animate-fade-in stagger-3"
              style={{ color: '#aaaaaa' }}>
              {['Terintegrasi Dukcapil', 'Enkripsi End-to-End', 'Gratis untuk WNI'].map(t => (
                <span key={t} className="flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: '#6D8196' }} />{t}
                </span>
              ))}
            </div>
          </div>
        }
      >
        {/* Dashboard preview inside ContainerScroll card */}
        <div className="h-full w-full flex flex-col" style={{ background: '#ffffff' }}>
          {/* Fake browser bar */}
          <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(74,74,74,0.1)' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#CBCBCB' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#CBCBCB' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#CBCBCB' }} />
            <div className="ml-3 px-3 py-0.5 rounded-full text-xs" style={{ background: 'rgba(109,129,150,0.1)', color: '#6D8196' }}>
              passporto.id/dashboard
            </div>
          </div>

          {/* Dashboard mockup content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-48 flex-shrink-0 p-3.5 space-y-1" style={{ borderRight: '1px solid rgba(255,255,255,0.08)', background: '#4A4A4A' }}>
              {/* Logo block matching layout.tsx */}
              <div className="flex items-center gap-2 px-3 py-3 mb-4 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-sm font-serif" style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#ffffff' }}>
                  PassPorto
                </span>
              </div>
              {[
                { label: 'Dashboard', icon: LayoutDashboard },
                { label: 'Ajukan Paspor', icon: FileText },
                { label: 'Lacak Status', icon: Bell },
                { label: 'Check-in GPS', icon: MapPin },
                { label: 'Pembayaran', icon: CreditCard },
                { label: 'Profil & NIK', icon: User },
              ].map((item, i) => {
                const Icon = item.icon;
                const active = i === 0;
                return (
                  <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium relative"
                    style={active ? {
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#ffffff',
                    } : {
                      color: '#CBCBCB',
                    }}>
                    {active && (
                      <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                        style={{ background: '#ffffff' }} />
                    )}
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                      style={active ? {
                        background: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      } : {
                        background: 'rgba(255,255,255,0.05)',
                      }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: active ? '#ffffff' : '#CBCBCB' }} />
                    </div>
                    <span style={{ color: active ? '#ffffff' : '#CBCBCB' }}>{item.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Main content */}
            <div className="flex-1 p-5 space-y-5 overflow-hidden flex flex-col justify-between" style={{ background: '#FFFFE3' }}>
              {/* Header */}
              <div>
                <h1 className="text-lg md:text-xl font-serif text-[#4A4A4A] tracking-tight font-normal">
                  Selamat Datang
                </h1>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Total Permohonan', value: 1, color: '#292966', bg: 'rgba(41,41,102,0.06)', border: 'rgba(41,41,102,0.18)', icon: FileText },
                  { label: 'Menunggu', value: 0, color: '#E35336', bg: 'rgba(227,83,54,0.06)', border: 'rgba(227,83,54,0.18)', icon: Clock },
                  { label: 'Diproses', value: 1, color: '#6D8196', bg: 'rgba(109,129,150,0.06)', border: 'rgba(109,129,150,0.18)', icon: Printer },
                  { label: 'Siap Diambil', value: 0, color: '#519755', bg: 'rgba(81,151,85,0.06)', border: 'rgba(81,151,85,0.18)', icon: Package },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="relative rounded-2xl p-4 overflow-hidden shadow-sm bg-white"
                      style={{ border: `1px solid ${stat.border}` }}>
                      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                        style={{ background: stat.color }} />
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#54663A', fontFamily: 'DM Sans, sans-serif' }}>
                          {stat.label}
                        </p>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                        </div>
                      </div>
                      <p className="text-2xl md:text-3xl font-serif font-normal" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Aksi Cepat */}
              <div>
                <h2 className="text-xs font-serif text-[#4A4A4A] mb-2.5 font-normal">Aksi Cepat</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Ajukan Paspor Baru', desc: 'Mulai permohonan', color: '#292966', bg: 'rgba(41,41,102,0.08)', icon: Plus },
                    { label: 'Lacak Status', desc: 'Pantau progres', color: '#6D8196', bg: 'rgba(109,129,150,0.08)', icon: Zap },
                    { label: 'Check-in GPS', desc: 'Check-in kanim', color: '#519755', bg: 'rgba(81,151,85,0.08)', icon: MapPin },
                    { label: 'Pembayaran', desc: 'Lihat tagihan', color: '#E35336', bg: 'rgba(227,83,54,0.08)', icon: CreditCard },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <div key={action.label} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: action.bg, border: `1px solid ${action.color}25` }}>
                          <Icon className="w-4 h-4" style={{ color: action.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[10px] text-[#4A4A4A] truncate">{action.label}</p>
                          <p className="text-[8px] font-semibold text-[#777777] truncate mt-0.5">{action.desc}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-[#777777]" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Permohonan Terbaru */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h2 className="text-xs font-serif text-[#4A4A4A] font-normal">Permohonan Terbaru</h2>
                  <span className="text-[10px] font-serif text-[#292966] flex items-center gap-0.5">
                    Lihat semua <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(109,129,150,0.08)', border: '1px solid rgba(109,129,150,0.15)' }}>
                      <Printer className="w-4 h-4" style={{ color: '#6D8196' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#4A4A4A] truncate">Muhammad Rafif</p>
                      <p className="text-[9px] font-semibold text-[#777777] mt-0.5">
                        NIK: 3173012903990002 · 06/06/2026
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[9px] font-bold text-[#b8860b] bg-[rgba(230,172,0,0.1)] border border-[rgba(230,172,0,0.25)]">
                      Diproses
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#777777]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContainerScroll>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-20 lg:px-32 py-16">
        <ScrollReveal animation="fade-in-up" delay={100}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ border: '1px solid rgba(74,74,74,0.12)', borderRadius: 16, overflow: 'hidden' }}>
            {stats.map((s, i) => (
              <div key={s.label} className="p-10 text-center" style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <p className="text-4xl md:text-5xl font-light mb-2"
                  style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#4A4A4A' }}>{s.value}</p>
                <p className="text-sm font-medium tracking-wider uppercase" style={{ color: '#aaaaaa' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="px-6 md:px-20 lg:px-32 py-20">
        <div className="divider mb-16" />

        <ScrollReveal animation="fade-in-up" delay={100}>
          <div className="mb-14">
            <span className="tag-label mb-4 inline-block">Fitur Utama</span>
            <h2 className="text-4xl md:text-6xl"
              style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#4A4A4A', fontWeight: 400, lineHeight: 1.08 }}>
              Solusi untuk{' '}
              <em style={{ fontStyle: 'italic', color: '#6D8196' }}>Setiap Masalah</em>
            </h2>
            <p className="mt-5 text-lg max-w-2xl leading-relaxed" style={{ color: '#777777' }}>
              Empat masalah utama sistem lama. Empat solusi spesifik yang kami bangun.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ border: '1px solid rgba(74,74,74,0.12)', borderRadius: 16, overflow: 'hidden' }}>
          {features.map((f, i) => (
            <ScrollReveal key={f.title} animation="fade-in-up" delay={120 + i * 80}>
              <div className="p-10 md:p-12 group cursor-default transition-colors"
                style={{ background: '#ffffff', borderBottom: i < 2 ? '1px solid rgba(74,74,74,0.08)' : 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f9fafb'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#ffffff'}>
                <div className="flex items-start justify-between mb-6">
                  <span className="text-sm font-semibold tracking-widest" style={{ color: '#CBCBCB' }}>{f.num}</span>
                  <f.icon className="w-6 h-6" style={{ color: '#6D8196' }} />
                </div>
                <h3 className="text-2xl font-medium mb-3"
                  style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#4A4A4A' }}>{f.title}</h3>
                <p className="text-base leading-relaxed" style={{ color: '#777777' }}>{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Steps ─────────────────────────────────────────────────────────── */}
      <section id="steps" className="px-6 md:px-20 lg:px-32 py-20">
        <div className="divider mb-16" />

        <ScrollReveal animation="fade-in-up" delay={100}>
          <div className="mb-14">
            <span className="tag-label mb-4 inline-block">Cara Kerja</span>
            <h2 className="text-4xl md:text-6xl"
              style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#4A4A4A', fontWeight: 400, lineHeight: 1.08 }}>
              Selesai dalam{' '}
              <em style={{ fontStyle: 'italic', color: '#6D8196' }}>4 Langkah</em>
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-0" style={{ border: '1px solid rgba(74,74,74,0.12)', borderRadius: 16, overflow: 'hidden' }}>
          {steps.map((s, i) => (
            <ScrollReveal key={s.num} animation="fade-in-up" delay={120 + i * 80}>
              <div className="flex items-start gap-8 px-10 py-10 group cursor-default"
                style={{
                  background: '#ffffff',
                  borderBottom: i < steps.length - 1 ? '1px solid rgba(74,74,74,0.08)' : 'none',
                  borderLeft: '3px solid transparent',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderLeftColor = '#6D8196';
                  (e.currentTarget as HTMLDivElement).style.background = '#f9fafb';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'transparent';
                  (e.currentTarget as HTMLDivElement).style.background = '#ffffff';
                }}>
                <span className="flex-shrink-0 text-6xl font-light leading-none"
                  style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#CBCBCB' }}>{s.num}</span>
                <div className="pt-2">
                  <h3 className="text-2xl font-medium mb-2"
                    style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#4A4A4A' }}>{s.title}</h3>
                  <p className="text-base leading-relaxed" style={{ color: '#777777' }}>{s.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── About ─────────────────────────────────────────────────────────── */}
      <section id="about" className="px-6 md:px-20 lg:px-32 py-20">
        <div className="divider mb-16" />

        <ScrollReveal animation="fade-in-up" delay={100}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Text */}
            <div>
              <span className="tag-label mb-4 inline-block">Tentang</span>
              <h2 className="text-4xl md:text-6xl mb-7"
                style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#4A4A4A', fontWeight: 400, lineHeight: 1.1 }}>
                Membawa Paspor ke{' '}
                <em style={{ fontStyle: 'italic', color: '#6D8196' }}>Era Modern</em>
              </h2>
              <p className="text-lg leading-relaxed mb-10" style={{ color: '#777777' }}>
                PassPorto lahir sebagai solusi atas antrean fisik yang melelahkan and transparansi kuota yang minim.
                Kami mengintegrasikan teknologi terkini untuk menciptakan layanan permohonan paspor Indonesia secara
                digital, transparan, dan aman bagi seluruh warga negara.
              </p>

              <div className="space-y-6">
                {[
                  { title: 'Verifikasi NIK Secara Instan', desc: 'Terintegrasi langsung dengan database kependudukan nasional untuk proses verifikasi yang aman dan cepat.' },
                  { title: 'Transparansi Penuh Slot Kuota', desc: 'Sistem alokasi transparan yang memantau ketersediaan slot di seluruh Kantor Imigrasi secara real-time.' },
                  { title: 'Pemrosesan Dokumen Otomatis', desc: 'Pemindaian dokumen dengan teknologi OCR untuk meminimalkan pengisian formulir secara manual.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-5 items-start">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(109,129,150,0.12)', border: '1px solid rgba(109,129,150,0.25)' }}>
                      <CheckCircle className="w-4 h-4" style={{ color: '#6D8196' }} />
                    </div>
                    <div>
                      <h4 className="font-medium text-base mb-1" style={{ color: '#4A4A4A' }}>{item.title}</h4>
                      <p className="text-base leading-relaxed" style={{ color: '#aaaaaa' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual — editorial stat block */}
            <div className="relative">
              <div className="p-10 rounded-2xl" style={{ background: '#4A4A4A' }}>
                <div className="mb-8">
                  <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#CBCBCB' }}>Sistem Terpadu</p>
                  <h3 className="text-4xl" style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#FFFFE3', fontWeight: 400 }}>
                    Satu platform,<br /><em style={{ fontStyle: 'italic', color: '#6D8196' }}>semua layanan</em>
                  </h3>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'NIK Verified Today', val: '12,847' },
                    { label: 'Active Slots Available', val: '3,291' },
                    { label: 'Passports Issued', val: '89,400+' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-4"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <span className="text-sm font-medium" style={{ color: '#CBCBCB' }}>{item.label}</span>
                      <span className="text-lg font-semibold" style={{ color: '#ffffff', fontFamily: 'DM Serif Display, serif' }}>{item.val}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link href="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-full transition-all"
                    style={{ background: '#ffffff', color: '#4A4A4A' }}>
                    Mulai Sekarang <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section id="cta" className="px-6 md:px-20 lg:px-32 py-20 mb-8">
        <div className="divider mb-16" />
        <ScrollReveal animation="fade-in-up" delay={100}>
          <div className="rounded-2xl p-14 md:p-20 text-center" style={{ background: '#4A4A4A' }}>
            <span className="tag-label mb-6 inline-block" style={{ borderColor: 'rgba(203,203,203,0.4)', color: '#CBCBCB' }}>
              Daftar Gratis
            </span>
            <h2 className="text-4xl md:text-6xl mb-5"
              style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#ffffff', fontWeight: 400, lineHeight: 1.08 }}>
              Siap Urus Paspor Anda?
            </h2>
            <p className="max-w-lg mx-auto mb-10 text-lg leading-relaxed" style={{ color: '#CBCBCB' }}>
              Buat akun dalam 60 detik dan mulai permohonan paspor tanpa repot.
            </p>
            <Link href="/register"
              className="inline-flex items-center gap-2 px-10 py-4 text-base font-semibold rounded-full transition-all btn-glow group"
              style={{ background: '#ffffff', color: '#4A4A4A' }}>
              Daftar Gratis Sekarang
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid rgba(74,74,74,0.1)' }}>
        <div className="px-6 md:px-20 lg:px-32 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <span className="text-xl mb-4 block" style={{ fontFamily: 'DM Serif Display, Georgia, serif', color: '#4A4A4A' }}>
                PassPorto
              </span>
              <p className="text-sm leading-relaxed" style={{ color: '#aaaaaa' }}>
                Sistem permohonan paspor digital Indonesia. Mudah, cepat, dan transparan.
              </p>
            </div>
            {/* Links */}
            {[
              { heading: 'Layanan', links: ['Ajukan Paspor', 'Lacak Status', 'Check-in GPS', 'Pembayaran'] },
              { heading: 'Informasi', links: ['Tentang Kami', 'Cara Kerja', 'FAQ', 'Kebijakan Privasi'] },
              { heading: 'Dukungan', links: ['Pusat Bantuan', 'Kontak', 'Status Sistem', 'Syarat & Ketentuan'] },
            ].map(col => (
              <div key={col.heading}>
                <p className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: '#4A4A4A' }}>{col.heading}</p>
                <ul className="space-y-3">
                  {col.links.map(l => (
                    <li key={l}>
                      <a href="#" className="text-sm transition-colors" style={{ color: '#aaaaaa' }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#6D8196'}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#aaaaaa'}>
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
            style={{ borderTop: '1px solid rgba(74,74,74,0.1)' }}>
            <p className="text-sm" style={{ color: '#CBCBCB' }}>© 2026 PassPorto — Sistem Paspor Digital Indonesia</p>
            <p className="text-sm" style={{ color: '#CBCBCB' }}>Dibuat untuk warga negara Indonesia</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
