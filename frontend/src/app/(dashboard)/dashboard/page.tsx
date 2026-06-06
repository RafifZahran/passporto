'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText, Clock, CheckCircle, Printer, Package,
  ChevronRight, Plus, ArrowRight, Shield, AlertCircle, Zap, MapPin, CreditCard,
  Fingerprint, Calendar
} from 'lucide-react';
import { applicationsApi } from '@/lib/api';
import type { Application, User } from '@/lib/types';

const statusConfig = {
  Pending:   { label: 'Menunggu',      className: 'status-pending',   icon: Clock,         step: 1 },
  Verified:  { label: 'Terverifikasi', className: 'status-verified',  icon: CheckCircle,   step: 2 },
  Printing:  { label: 'Dicetak',       className: 'status-printing',  icon: Printer,       step: 3 },
  Ready:     { label: 'Siap Diambil',  className: 'status-ready',     icon: Package,       step: 4 },
  Completed: { label: 'Selesai',       className: 'status-completed', icon: CheckCircle,   step: 5 },
};

const quickActions = [
  { href: '/apply',    icon: Plus,       label: 'Ajukan Paspor Baru', desc: 'Mulai permohonan baru',      color: '#292966', bg: 'rgba(41,41,102,0.08)'   },
  { href: '/tracker',  icon: Zap,        label: 'Lacak Status',       desc: 'Pantau progres permohonan',  color: '#6D8196', bg: 'rgba(109,129,150,0.08)' },
  { href: '/checkin',  icon: MapPin,     label: 'Check-in GPS',       desc: 'Check-in di Kanim',          color: '#519755', bg: 'rgba(81,151,85,0.08)'   },
  { href: '/payments', icon: CreditCard, label: 'Pembayaran',         desc: 'Lihat tagihan & riwayat',    color: '#E35336', bg: 'rgba(227,83,54,0.08)'   },
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('passporto_user');
    if (stored) setUser(JSON.parse(stored));
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await applicationsApi.getAll();
      setApplications(res.data.applications || []);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total:   applications.length,
    pending: applications.filter(a => a.status === 'Pending').length,
    active:  applications.filter(a => ['Verified', 'Printing'].includes(a.status)).length,
    ready:   applications.filter(a => a.status === 'Ready').length,
  };

  const statCards = [
    { label: 'Total Permohonan', value: stats.total,   color: '#292966', bg: 'rgba(41,41,102,0.06)',   border: 'rgba(41,41,102,0.18)',   icon: FileText },
    { label: 'Menunggu',         value: stats.pending,  color: '#E35336', bg: 'rgba(227,83,54,0.06)',   border: 'rgba(227,83,54,0.18)',   icon: Clock    },
    { label: 'Diproses',         value: stats.active,   color: '#6D8196', bg: 'rgba(109,129,150,0.06)', border: 'rgba(109,129,150,0.18)', icon: Printer  },
    { label: 'Siap Diambil',     value: stats.ready,    color: '#519755', bg: 'rgba(81,151,85,0.06)',   border: 'rgba(81,151,85,0.18)',   icon: Package  },
  ];

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Warga';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-9">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl md:text-3xl font-serif text-[#4A4A4A] font-normal tracking-tight">
          Selamat Datang
        </h1>

        {/* NIK warning banner */}
        {!user?.is_verified && (
          <div className="flex items-center gap-3 mt-5 p-4 rounded-xl text-sm"
            style={{ background: 'rgba(227,83,54,0.06)', border: '1px solid rgba(227,83,54,0.2)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(227,83,54,0.1)' }}>
              <AlertCircle className="w-4 h-4" style={{ color: '#E35336' }} />
            </div>
            <span style={{ color: '#4A4A4A', fontFamily: 'DM Sans, sans-serif' }}>
              Akun Anda belum terverifikasi NIK.{' '}
              <a href="/profile" style={{ color: '#E35336', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>
                Verifikasi sekarang
              </a>
              {' '}untuk mengajukan paspor.
            </span>
          </div>
        )}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in-up stagger-1">
        {statCards.map((stat) => (
          <div key={stat.label}
            className="relative rounded-2xl p-6 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
            style={{
              background: '#ffffff',
              border: `1px solid ${stat.border}`,
            }}>
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
              style={{ background: stat.color }} />

            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#54663A', fontFamily: 'DM Sans, sans-serif' }}>
                {stat.label}
              </p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
             </div>
            <p className="text-4xl font-serif font-normal" style={{ color: stat.color }}>
              {loading ? <span className="skeleton w-8 h-8 inline-block rounded" /> : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div className="animate-fade-in-up stagger-2">
        <h2 className="text-xl font-serif text-[#4A4A4A] mb-4 font-normal">
          Aksi Cepat
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <a key={action.href} href={action.href}
              className="flex items-center gap-4 p-5 rounded-2xl transition-all duration-200 group hover:-translate-y-0.5 shadow-sm"
              style={{
                background: '#ffffff',
                border: '1px solid rgba(74,74,74,0.12)',
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.border = `1px solid ${action.color}35`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${action.bg}`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.border = '1px solid rgba(74,74,74,0.12)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ background: action.bg, border: `1px solid ${action.color}25` }}>
                <action.icon className="w-4.5 h-4.5" style={{ color: action.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-[#4A4A4A] truncate">{action.label}</p>
                <p className="text-xs font-semibold truncate mt-0.5" style={{ color: '#777777' }}>{action.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 flex-shrink-0 transition-colors group-hover:translate-x-0.5" style={{ color: '#777777' }} />
            </a>
          ))}
        </div>
      </div>

      {/* ── Recent Applications ──────────────────────────────────────────── */}
      <div className="animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif text-[#4A4A4A] font-normal">
            Permohonan Terbaru
          </h2>
          <a href="/tracker" className="text-sm font-serif font-normal flex items-center gap-1 transition-colors hover:underline"
            style={{ color: '#292966', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#E35336'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#292966'}>
            Lihat semua <ChevronRight className="w-3 h-3" />
          </a>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-14 rounded-2xl"
            style={{ background: '#ffffff', border: '1px solid rgba(74,74,74,0.1)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(41,41,102,0.06)', border: '1px solid rgba(41,41,102,0.15)' }}>
              <FileText className="w-7 h-7" style={{ color: '#292966' }} />
            </div>
            <p className="text-lg font-serif text-[#4A4A4A] mb-1 font-normal">
              Belum ada permohonan
            </p>
            <p className="text-sm mb-6 font-medium" style={{ color: '#777777' }}>Mulai ajukan paspor pertama Anda</p>
            <a href="/apply"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all"
              style={{ background: '#4A4A4A', color: '#FFFFE3', textDecoration: 'none' }}>
              <Plus className="w-4 h-4" /> Ajukan Sekarang
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.slice(0, 5).map((app) => {
              const sc = statusConfig[app.status as keyof typeof statusConfig];
              return (
                <a key={app.id} href={`/tracker?id=${app.id}`}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm transition-all duration-200 group hover:-translate-y-px"
                  style={{ textDecoration: 'none' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.border = '1px solid rgba(109,129,150,0.25)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(74,74,74,0.06)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.border = '1px solid rgba(74,74,74,0.12)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(109,129,150,0.08)', border: '1px solid rgba(109,129,150,0.15)' }}>
                    <sc.icon className="w-4.5 h-4.5" style={{ color: '#6D8196' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#4A4A4A] truncate">
                      {app.full_name}
                    </p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#777777' }}>
                      NIK: {app.nik} · {new Date(app.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${sc.className}`}>
                    {sc.label}
                  </span>
                  <ChevronRight className="w-4 h-4 flex-shrink-0 transition-colors group-hover:translate-x-0.5" style={{ color: '#777777' }} />
                </a>
              );
            })}
          </div>
        )}
      </div>
 
      {/* ── Panduan Alur Pengajuan Paspor ───────────────────────────────── */}
      <div className="animate-fade-in-up stagger-4 pt-4">
        <h2 className="text-xl font-serif text-[#4A4A4A] mb-4 font-normal">
          Alur Pengajuan Paspor
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: 'Langkah 1',
              title: 'Verifikasi NIK (e-KYC)',
              desc: 'Lakukan verifikasi NIK KTP Anda pada halaman Profil. Verifikasi ini diperlukan sebelum dapat mengajukan permohonan paspor.',
              icon: Fingerprint,
              color: '#292966',
              bg: 'rgba(41,41,102,0.06)',
              border: 'rgba(41,41,102,0.15)',
            },
            {
              step: 'Langkah 2',
              title: 'Pilih Kantor & Jadwal',
              desc: 'Pilih Kantor Imigrasi terdekat dan tanggal kunjungan yang tersedia untuk melakukan wawancara, verifikasi berkas, dan pengambilan biometrik.',
              icon: Calendar,
              color: '#54663A',
              bg: 'rgba(84,102,58,0.06)',
              border: 'rgba(84,102,58,0.15)',
            },
            {
              step: 'Langkah 3',
              title: 'Check-in GPS & Antrean',
              desc: 'Datang ke Kantor Imigrasi pada tanggal pilihan Anda, lakukan check-in GPS dalam radius 100m dari lokasi kanim untuk mengambil nomor antrean.',
              icon: MapPin,
              color: '#519755',
              bg: 'rgba(81,151,85,0.06)',
              border: 'rgba(81,151,85,0.15)',
            },
          ].map((item) => (
            <div key={item.step} className="p-6 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: item.bg, border: `1px solid ${item.border}`, color: item.color }}>
                    {item.step}
                  </span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                </div>
                <h3 className="font-serif text-base text-[#4A4A4A] font-normal mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-[#777777] font-semibold leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
