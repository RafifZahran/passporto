'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileText, Clock, CheckCircle, Printer, Package,
  ChevronRight, MapPin, CreditCard, RefreshCw, QrCode, Bell, Info, BookOpen, PhoneCall, AlertTriangle
} from 'lucide-react';
import { applicationsApi } from '@/lib/api';
import { ToastContainer, useToast, usePushNotificationSimulator } from '@/components/ToastNotification';
import type { Application } from '@/lib/types';

const STATUS_STEPS = [
  { key: 'Pending',  label: 'Menunggu Pembayaran', icon: Clock,       desc: 'Lakukan pembayaran untuk melanjutkan proses.' },
  { key: 'Verified', label: 'Terverifikasi',        icon: CheckCircle, desc: 'Pembayaran dikonfirmasi. Permohonan sedang diproses.' },
  { key: 'Printing', label: 'Sedang Dicetak',       icon: Printer,     desc: 'Paspor Anda sedang dalam proses percetakan.' },
  { key: 'Ready',    label: 'Siap Diambil',          icon: Package,     desc: 'Kunjungi kantor imigrasi untuk mengambil paspor.' },
  { key: 'Completed', label: 'Selesai',              icon: CheckCircle, desc: 'Paspor Anda telah diserahkan dan selesai diproses.' },
];

function TrackerContent() {
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toasts, add: addToast, remove } = useToast();

  // Fire mock push notifications when status changes
  usePushNotificationSimulator(addToast, selected?.status || '');

  const fetchApps = useCallback(async () => {
    try {
      const res = await applicationsApi.getAll();
      const apps: Application[] = res.data.applications || [];
      setApplications(apps);
      const activeApps = apps.filter(a => a.status !== 'Completed');

      setSelected(prev => {
        const targetId = prev ? prev.id : selectedId;
        if (!targetId) {
          // Default: select the first active app on load
          return activeApps[0] || null;
        }
        const found = apps.find(a => a.id === targetId);
        if (prev && found && prev.status !== found.status) {
          addToast({
            type: 'notification',
            title: `Status diperbarui: ${found.status}`,
            body: STATUS_STEPS.find(s => s.key === found.status)?.desc,
          });
        }
        // If active app transitions to completed, clear selection
        if (prev && prev.status !== 'Completed' && found && found.status === 'Completed') {
          return null;
        }
        return found || null;
      });
    } catch { /* silently handle */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [selectedId, addToast]);

  useEffect(() => { fetchApps(); }, []);

  // Auto-poll every 15 seconds for real-time status updates
  useEffect(() => {
    const interval = setInterval(fetchApps, 15000);
    return () => clearInterval(interval);
  }, [fetchApps]);

  const handleRefresh = () => { setRefreshing(true); fetchApps(); };

  const currentStepIdx = selected ? STATUS_STEPS.findIndex(s => s.key === selected.status) : -1;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto text-[#4A4A4A]">
      <div className="flex items-center justify-between mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-serif text-[#4A4A4A] mb-1 font-normal">Lacak Status Paspor</h1>
          <p className="text-[#777777] text-sm font-medium">Diperbarui otomatis setiap 15 detik · Notifikasi push aktif</p>
        </div>
        <button id="tracker-refresh-btn" onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-[rgba(74,74,74,0.12)] shadow-sm hover:bg-[#f8f8f0] transition-all disabled:opacity-50 cursor-pointer text-[#4A4A4A]">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[rgba(74,74,74,0.12)] shadow-sm">
          <FileText className="w-12 h-12 text-[#777777] mx-auto mb-4" />
          <p className="text-[#4A4A4A] font-bold mb-2">Belum ada permohonan</p>
          <a href="/apply" className="text-[#292966] hover:text-[#4A4A4A] text-sm font-bold underline">Ajukan sekarang</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Application list */}
          <div className="space-y-6 animate-fade-in-up stagger-1">
            {/* Active Applications */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#777777] uppercase tracking-wide mb-3">Permohonan Aktif</p>
              {applications.filter(a => a.status !== 'Completed').length === 0 ? (
                <p className="text-xs text-[#777777] font-semibold italic p-3 bg-white border border-[rgba(74,74,74,0.12)] rounded-2xl shadow-sm text-center">Tidak ada permohonan aktif</p>
              ) : (
                applications.filter(a => a.status !== 'Completed').map(app => {
                  const sc = STATUS_STEPS.find(s => s.key === app.status);
                  const isActive = selected?.id === app.id;
                  return (
                    <button key={app.id} id={`tracker-app-${app.id.slice(0,8)}`} onClick={() => setSelected(app)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left border border-[rgba(74,74,74,0.12)] shadow-sm transition-all cursor-pointer bg-white">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={isActive ? { background: 'rgba(109,129,150,0.1)' } : { background: 'rgba(74,74,74,0.03)' }}>
                        {sc && <sc.icon className={`w-5 h-5 ${isActive ? 'text-[#292966]' : 'text-[#777777]'}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${isActive ? 'text-[#292966]' : 'text-[#4A4A4A]'}`}>{app.full_name}</p>
                        <p className="text-xs text-[#777777] mt-0.5 font-medium">{new Date(app.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0
                        ${app.status === 'Pending' ? 'status-pending' : app.status === 'Verified' ? 'status-verified' : app.status === 'Printing' ? 'status-printing' : 'status-ready'}`}>
                        {sc?.label?.split(' ')[0]}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Riwayat Permohonan */}
            {applications.filter(a => a.status === 'Completed').length > 0 && (
              <div className="space-y-2 pt-4 border-t border-[rgba(74,74,74,0.12)]">
                <p className="text-xs font-bold text-[#777777] uppercase tracking-wide mb-3">Riwayat Selesai</p>
                {applications.filter(a => a.status === 'Completed').map(app => {
                  const sc = STATUS_STEPS.find(s => s.key === app.status);
                  const isActive = selected?.id === app.id;
                  return (
                    <button key={app.id} id={`tracker-app-${app.id.slice(0,8)}`} onClick={() => setSelected(app)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left border border-[rgba(74,74,74,0.12)] shadow-sm transition-all cursor-pointer opacity-85 hover:opacity-100 bg-white">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={isActive ? { background: 'rgba(109,129,150,0.1)' } : { background: 'rgba(74,74,74,0.02)' }}>
                        {sc && <sc.icon className={`w-5 h-5 ${isActive ? 'text-[#292966]' : 'text-[#777777]'}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${isActive ? 'text-[#292966]' : 'text-[#4A4A4A]'}`}>{app.full_name}</p>
                        <p className="text-xs text-[#777777] mt-0.5 font-medium">{new Date(app.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0 status-completed text-center">
                        Selesai
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail + stepper or empty placeholder */}
          {selected ? (
            <div className="lg:col-span-2 space-y-5 animate-fade-in-up stagger-2">
              {/* Status stepper */}
              <div className="p-6 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-[#4A4A4A]">Progres Permohonan</h2>
                  <div className="flex items-center gap-1.5 text-xs text-[#777777] font-semibold">
                    <Bell className="w-3.5 h-3.5 text-[#777777]" />Push notif aktif
                  </div>
                </div>
                <div className="space-y-1">
                  {STATUS_STEPS.map((step, idx) => {
                    const done = idx < currentStepIdx;
                    const active = idx === currentStepIdx;
                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500`}
                            style={done ? { background: 'rgba(81,151,85,0.08)', border: '1px solid rgba(81,151,85,0.2)' }
                                : active ? { background: 'rgba(109,129,150,0.1)', border: '1px solid #6D8196' }
                                : { background: 'rgba(74,74,74,0.02)', border: '1px solid rgba(74,74,74,0.06)' }}>
                            <step.icon className={`w-4 h-4 ${done ? 'text-[#519755]' : active ? 'text-[#292966]' : 'text-[#777777]'}`} />
                            {active && (
                              <div className="absolute inset-0 rounded-full border-2 border-[#292966]/40 animate-ping" />
                            )}
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div className={`w-px my-1 transition-all duration-700 ${done ? 'bg-[#519755]/40' : 'bg-[rgba(74,74,74,0.08)]'}`} style={{ height: '28px' }} />
                          )}
                        </div>
                        <div className="pb-4 pt-2 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm ${done ? 'text-[#519755] font-bold' : active ? 'text-[#292966] font-bold' : 'text-[#777777] font-semibold'}`}>
                              {step.label}
                            </p>
                            {active && (
                              <span className="text-xs px-2 py-0.5 rounded-full status-verified font-bold">Saat ini</span>
                            )}
                            {done && (
                              <CheckCircle className="w-3.5 h-3.5 text-[#519755]" />
                            )}
                          </div>
                          {(active || done) && (
                            <p className="text-xs text-[#777777] mt-0.5 font-medium">{step.desc}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Application info */}
              <div className="p-6 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm">
                <h3 className="font-bold text-sm mb-4 text-[#4A4A4A]">Detail Permohonan</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'NIK', value: selected.nik },
                    { label: 'Nama', value: selected.full_name },
                    { label: 'Jenis Kelamin', value: selected.gender },
                    { label: 'Status', value: selected.status },
                    { label: 'Tanggal Daftar', value: new Date(selected.created_at).toLocaleDateString('id-ID') },
                    { label: 'No. Antre', value: selected.queue_number || 'Belum check-in' },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-xs text-[#777777] mb-1 font-semibold uppercase tracking-wide">{f.label}</p>
                      <p className="font-bold text-[#4A4A4A]">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA actions */}
              <div className="flex flex-wrap gap-3">
                {selected.status === 'Pending' && (
                  <a href={`/payments?app=${selected.id}`}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-[#FFFFE3] bg-[#4A4A4A] hover:bg-[#333333] border-none btn-glow transition-all cursor-pointer">
                    <CreditCard className="w-4 h-4" />Bayar Sekarang
                  </a>
                )}
                {selected.status === 'Verified' && !selected.queue_number && (
                  <a href={`/checkin?app=${selected.id}`}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-[#FFFFE3] bg-[#4A4A4A] hover:bg-[#333333] border-none btn-glow transition-all cursor-pointer">
                    <MapPin className="w-4 h-4" />Check-in GPS
                  </a>
                )}
                {selected.queue_number && (
                  <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-[rgba(74,74,74,0.12)] text-sm font-semibold text-[#4A4A4A]">
                    <QrCode className="w-4 h-4 text-[#292966]" />
                    No. Antre: <strong className="text-[#292966] ml-1">{selected.queue_number}</strong>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 space-y-5 animate-fade-in">
            <div className="flex flex-col items-center justify-center p-10 text-center bg-white rounded-3xl border border-[rgba(74,74,74,0.12)] shadow-sm min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'rgba(109, 129, 150, 0.08)', border: '1px solid rgba(109, 129, 150, 0.2)' }}>
                <Bell className="w-8 h-8 text-[#292966]" />
              </div>
              <h3 className="font-bold text-lg text-[#4A4A4A]">Tidak Ada Permohonan Aktif</h3>
              <p className="text-[#777777] text-sm max-w-md mt-2">
                Seluruh pengajuan paspor Anda telah selesai diproses. Pilih riwayat di kiri untuk melihat detail, atau ajukan paspor baru.
              </p>
              <a href="/apply" className="mt-5 px-6 py-3 rounded-xl font-bold text-[#FFFFE3] bg-[#4A4A4A] hover:bg-[#333333] border-none btn-glow transition-all text-sm">
                Ajukan Paspor Baru
              </a>
            </div>

            {/* Info panel below empty state */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: PhoneCall, color: '#292966', title: 'Hotline Imigrasi', desc: '(021) 526-7022 · Senin–Jumat 08.00–16.00 WIB' },
                { icon: BookOpen, color: '#519755', title: 'Syarat Paspor Biasa', desc: 'KTP, KK, Akte Lahir, dan materai 10.000 asli.' },
                { icon: AlertTriangle, color: '#54663A', title: 'Masa Berlaku', desc: 'Paspor Biasa berlaku 5 tahun, Paspor Elektronik 10 tahun.' },
              ].map(card => (
                <div key={card.title} className="p-5 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] space-y-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}>
                    <card.icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                  <p className="font-bold text-sm text-[#4A4A4A]">{card.title}</p>
                  <p className="text-xs text-[#777777] leading-relaxed font-medium">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* PNBP Biaya Panel */}
            <div className="p-6 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#292966]" />
                <h3 className="font-bold text-sm text-[#4A4A4A]">Biaya PNBP Paspor 2025</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { type: 'Paspor Biasa 48 Hal', price: 'Rp 350.000', note: 'Masa berlaku 5 tahun' },
                  { type: 'Paspor Elektronik 48 Hal', price: 'Rp 650.000', note: 'Masa berlaku 10 tahun' },
                  { type: 'Biaya Percepatan', price: 'Rp 1.000.000', note: 'Layanan prioritas 1 hari' },
                  { type: 'Biaya Pengiriman', price: 'Rp 35.000', note: 'Opsional, via pos terdaftar' },
                ].map(item => (
                  <div key={item.type} className="flex items-center justify-between p-3 rounded-xl border border-[rgba(74,74,74,0.12)] bg-white">
                    <div>
                      <p className="text-xs font-bold text-[#4A4A4A]">{item.type}</p>
                      <p className="text-[10px] text-[#777777] font-medium">{item.note}</p>
                    </div>
                    <span className="text-sm font-extrabold text-[#292966]">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
}

export default function TrackerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[#777777] font-medium">Memuat...</div>}>
      <TrackerContent />
    </Suspense>
  );
}
