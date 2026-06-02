'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText, Clock, CheckCircle, Printer, Package,
  ChevronRight, Plus, ArrowRight, Shield, AlertCircle, Zap, MapPin, CreditCard
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
  { href: '/apply',   icon: Plus,        label: 'Ajukan Paspor Baru', desc: 'Mulai permohonan baru',       color: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
  { href: '/tracker', icon: Zap,         label: 'Lacak Status',       desc: 'Pantau progres permohonan',   color: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  { href: '/checkin', icon: MapPin,      label: 'Check-in GPS',       desc: 'Check-in di Kanim',           color: '#10b981', glow: 'rgba(16,185,129,0.15)' },
  { href: '/payments',icon: CreditCard,  label: 'Pembayaran',         desc: 'Lihat tagihan & riwayat',     color: '#f43f5e', glow: 'rgba(244,63,94,0.15)' },
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
    { label: 'Total Permohonan', value: stats.total,   color: '#3b82f6', glow: 'rgba(59,130,246,0.15)',  icon: FileText, border: 'rgba(59,130,246,0.25)'  },
    { label: 'Menunggu',         value: stats.pending,  color: '#f59e0b', glow: 'rgba(245,158,11,0.15)',  icon: Clock,    border: 'rgba(245,158,11,0.25)'  },
    { label: 'Diproses',         value: stats.active,   color: '#8b5cf6', glow: 'rgba(139,92,246,0.15)',  icon: Printer,  border: 'rgba(139,92,246,0.25)'  },
    { label: 'Siap Diambil',     value: stats.ready,    color: '#10b981', glow: 'rgba(16,185,129,0.15)',  icon: Package,  border: 'rgba(16,185,129,0.25)'  },
  ];

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Warga';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-7" style={{ color: 'var(--text)' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="animate-fade-in-up">
        <p className="text-slate-400 text-sm mb-1">{greeting},</p>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight"
          style={{ fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
          {displayName}
        </h1>

        {/* NIK warning banner */}
        {!user?.is_verified && (
          <div className="flex items-center gap-3 mt-5 p-4 rounded-xl text-sm"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.15)' }}>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-slate-300 font-medium">
              Akun Anda belum terverifikasi NIK.{' '}
              <a href="/profile" className="text-amber-400 font-bold hover:text-amber-300 transition-colors underline underline-offset-2">
                Verifikasi sekarang
              </a>
              {' '}untuk mengajukan paspor.
            </span>
          </div>
        )}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        {statCards.map((stat) => (
          <div key={stat.label}
            className="relative rounded-2xl p-5 overflow-hidden group cursor-default transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${stat.border}`,
              boxShadow: `0 0 20px ${stat.glow}`,
            }}>
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
              style={{ background: `linear-gradient(90deg, ${stat.color}, transparent)` }} />

            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{stat.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${stat.color}20`, border: `1px solid ${stat.color}30` }}>
                <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-3xl font-black" style={{ color: stat.color, fontFamily: 'Space Grotesk, sans-serif' }}>
              {loading ? <span className="skeleton w-8 h-8 inline-block rounded" /> : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div className="animate-fade-in-up stagger-2">
        <h2 className="text-base font-bold mb-4 text-slate-300">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <a key={action.href} href={action.href}
              className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200 group hover:-translate-y-0.5"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.border = `1px solid ${action.color}40`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 25px ${action.glow}`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.border = '1px solid var(--border)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                style={{ background: action.glow, border: `1px solid ${action.color}30` }}>
                <action.icon className="w-4 h-4" style={{ color: action.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-slate-200 truncate">{action.label}</p>
                <p className="text-xs text-slate-400 truncate">{action.desc}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 flex-shrink-0 transition-colors" />
            </a>
          ))}
        </div>
      </div>

      {/* ── Recent Applications ──────────────────────────────────────────── */}
      <div className="animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-300">Permohonan Terbaru</h2>
          <a href="/tracker" className="text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors">
            Lihat semua <ChevronRight className="w-3 h-3" />
          </a>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-14 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <FileText className="w-7 h-7 text-blue-500" />
            </div>
            <p className="text-slate-200 font-bold mb-1">Belum ada permohonan</p>
            <p className="text-slate-400 text-sm mb-6">Mulai ajukan paspor pertama Anda</p>
            <a href="/apply"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white btn-glow transition-all"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <Plus className="w-4 h-4" /> Ajukan Sekarang
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {applications.slice(0, 5).map((app) => {
              const sc = statusConfig[app.status as keyof typeof statusConfig];
              return (
                <a key={app.id} href={`/tracker?id=${app.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group hover:-translate-y-px"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.border = '1px solid rgba(59,130,246,0.2)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.border = '1px solid var(--border)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                    <sc.icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-200 truncate">{app.full_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">NIK: {app.nik} · {new Date(app.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${sc.className}`}>
                    {sc.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors flex-shrink-0" />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
