'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, CheckCircle, Clock, XCircle, Loader2, AlertCircle, Copy, Zap, ChevronDown, ArrowLeft, ChevronRight } from 'lucide-react';
import { paymentsApi, applicationsApi } from '@/lib/api';
import type { Payment, Application } from '@/lib/types';

// Simulates a payment gateway webhook arriving at the backend
// In production this is triggered by the actual payment gateway (Midtrans, Xendit, etc.)
async function simulateWebhook(referenceId: string, channel: string): Promise<void> {
  const res = await fetch('/api/simulate-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reference_id: referenceId,
      channel,
      status: 'settlement',
      amount: 350000,
      signature_key: 'mock',
    }),
  });
  if (!res.ok) throw new Error('Webhook simulation failed');
}

const PAYMENT_CHANNELS = [
  { id: 'BCA_TRANSFER',   label: 'BCA Virtual Account',  color: '#0052a5' },
  { id: 'MANDIRI',         label: 'Mandiri Virtual Account', color: '#003d82' },
  { id: 'GOPAY',           label: 'GoPay',                 color: '#00aed6' },
  { id: 'OVO',             label: 'OVO',                   color: '#4c3494' },
  { id: 'QRIS',            label: 'QRIS',                  color: '#e60012' },
];

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appIdParam = searchParams.get('app') || '';
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(appIdParam || null);
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [channel, setChannel] = useState('GOPAY');
  const [initiating, setInitiating] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const PASSPORT_FEE = 350000;

  useEffect(() => {
    applicationsApi.getAll().then(res => {
      const apps: Application[] = res.data.applications || [];
      setApplications(apps);
      if (appIdParam) {
        setSelectedAppId(appIdParam);
        const match = apps.find((a: Application) => a.id === appIdParam);
        if (match) {
          setActiveTab(match.status === 'Pending' ? 'unpaid' : 'paid');
        }
      } else {
        const unpaid = apps.filter((a: Application) => a.status === 'Pending');
        if (unpaid.length === 1) {
          setSelectedAppId(unpaid[0].id);
          setActiveTab('unpaid');
        } else {
          setSelectedAppId(null);
          setActiveTab('unpaid');
        }
      }
    }).catch(() => {});
  }, [appIdParam]);

  useEffect(() => {
    if (selectedAppId) {
      paymentsApi.getByApplication(selectedAppId)
        .then(res => setPayment(res.data))
        .catch(() => setPayment(null));
    } else {
      setPayment(null);
    }
  }, [selectedAppId]);

  const handleInitiate = async () => {
    if (!selectedAppId) return;
    setInitiating(true); setError('');
    try {
      const res = await paymentsApi.initiate(selectedAppId, PASSPORT_FEE);
      setPayment(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal membuat tagihan pembayaran.');
    } finally {
      setInitiating(false);
    }
  };

  // Simulate the full async webhook flow:
  // 1. User "pays" via selected channel
  // 2. Frontend calls internal API route which forwards to Go backend webhook endpoint
  // 3. Backend marks payment Verified + transitions application to Verified
  // 4. Frontend polls payment status to show updated state
  const handleSimulatePayment = async () => {
    if (!payment || !selectedAppId) return;
    setSimulating(true); setError('');
    try {
      await simulateWebhook(payment.reference_id, channel);
      // Poll for updated status (webhook is async — give it a moment)
      setPolling(true);
      await new Promise(r => setTimeout(r, 1500));
      const res = await paymentsApi.getByApplication(selectedAppId);
      setPayment(res.data);
      if (res.data && res.data.status === 'Verified') {
        // Refresh application list so it moves to paid tab
        const appsRes = await applicationsApi.getAll();
        setApplications(appsRes.data.applications || []);
        
        setTimeout(() => {
          router.push('/tracker');
        }, 2000);
      }
    } catch (err: any) {
      setError('Simulasi pembayaran gagal. Pastikan backend berjalan.');
    } finally {
      setSimulating(false); setPolling(false);
    }
  };

  const copyRef = () => {
    if (payment?.reference_id) {
      navigator.clipboard.writeText(payment.reference_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedApp = selectedAppId ? applications.find((a: Application) => a.id === selectedAppId) : null;

  const unpaidApps = applications.filter((a: Application) => a.status === 'Pending');
  const paidApps = applications.filter((a: Application) => a.status !== 'Pending');

  const currentTabIsEmpty = activeTab === 'unpaid' ? unpaidApps.length === 0 : paidApps.length === 0;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 text-slate-100">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold mb-1 text-slate-100">Pembayaran</h1>
        <p className="text-slate-300 text-sm font-medium">Kelola tagihan aktif dan riwayat bukti pembayaran paspor Anda.</p>
      </div>

      {currentTabIsEmpty ? (
        <div className="space-y-6 animate-fade-in-up stagger-1">
          {/* Tabs Selector (Centered / Compact) */}
          <div className="max-w-md mx-auto">
            <div className="flex gap-2 p-1 bg-slate-900/60 border border-slate-800 rounded-xl">
              <button
                onClick={() => {
                  setActiveTab('unpaid');
                  const unpaid = applications.filter((a: Application) => a.status === 'Pending');
                  setSelectedAppId(unpaid.length > 0 ? unpaid[0].id : null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'unpaid'
                    ? 'bg-blue-600/20 border border-blue-500/35 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Belum Dibayar ({unpaidApps.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('paid');
                  const paid = applications.filter((a: Application) => a.status !== 'Pending');
                  setSelectedAppId(paid.length > 0 ? paid[0].id : null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'paid'
                    ? 'bg-blue-600/20 border border-blue-500/35 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Riwayat Pembayaran ({paidApps.length})
              </button>
            </div>
          </div>

          {/* Centered Empty State Card */}
          <div className="flex flex-col items-center justify-center p-8 text-center card-gradient rounded-3xl border border-white/8 min-h-[350px] max-w-xl mx-auto space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 animate-pulse-glow"
              style={{
                background: activeTab === 'unpaid' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(148, 163, 184, 0.08)',
                border: activeTab === 'unpaid' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(148, 163, 184, 0.2)'
              }}>
              {activeTab === 'unpaid' ? (
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              ) : (
                <Clock className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <h3 className="font-bold text-lg text-slate-200">
              {activeTab === 'unpaid' ? 'Tidak Ada Tagihan Aktif' : 'Belum Ada Riwayat Pembayaran'}
            </h3>
            <p className="text-slate-350 text-xs max-w-md leading-relaxed">
              {activeTab === 'unpaid'
                ? 'Semua pengajuan paspor Anda telah dibayar atau tidak ada pengajuan baru yang membutuhkan tindakan pembayaran.'
                : 'Anda belum memiliki riwayat transaksi pembayaran paspor. Silakan selesaikan pembayaran tagihan aktif Anda.'}
            </p>
            <div className="pt-2">
              <button
                onClick={() => router.push(activeTab === 'unpaid' ? '/tracker' : '/apply')}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white btn-glow transition-all cursor-pointer bg-blue-600 hover:bg-blue-500"
                style={{ background: 'linear-gradient(135deg, #097DE9, #0d6efd)' }}
              >
                {activeTab === 'unpaid' ? 'Lacak Status' : 'Ajukan Paspor'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Tabs and List */}
          <div className="space-y-4 animate-fade-in-up stagger-1">
            {/* Tabs Selector */}
            <div className="flex gap-2 p-1 bg-slate-900/60 border border-slate-800 rounded-xl">
              <button
                onClick={() => {
                  setActiveTab('unpaid');
                  const unpaid = applications.filter((a: Application) => a.status === 'Pending');
                  setSelectedAppId(unpaid.length > 0 ? unpaid[0].id : null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'unpaid'
                    ? 'bg-blue-600/20 border border-blue-500/35 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Belum Dibayar ({unpaidApps.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('paid');
                  const paid = applications.filter((a: Application) => a.status !== 'Pending');
                  setSelectedAppId(paid.length > 0 ? paid[0].id : null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'paid'
                    ? 'bg-blue-600/20 border border-blue-500/35 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Riwayat Pembayaran ({paidApps.length})
              </button>
            </div>

            {/* List of applications */}
            <div className="space-y-2">
              {(activeTab === 'unpaid' ? unpaidApps : paidApps).map(app => {
                const isActive = selectedAppId === app.id;
                const isPaid = app.status !== 'Pending';
                return (
                  <button key={app.id} onClick={() => setSelectedAppId(app.id)}
                    className="w-full flex items-center justify-between p-4 rounded-xl text-left border transition-all cursor-pointer"
                    style={isActive
                      ? { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)' }
                      : { background: isPaid ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)', border: isPaid ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="min-w-0 space-y-1">
                      <p className={`font-bold text-xs ${isActive ? 'text-blue-400' : 'text-slate-100'}`}>{app.full_name}</p>
                      <p className="text-[10px] text-slate-350">NIK: {app.nik}</p>
                    </div>
                    <span className={`font-extrabold text-xs flex-shrink-0 ${isPaid ? 'text-emerald-400 font-bold' : 'text-blue-400'}`}>
                      {isPaid ? 'Lunas' : 'Rp 350K'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Checkout or Receipt details */}
          <div className="lg:col-span-2 space-y-5 animate-fade-in-up stagger-2">
            {selectedApp ? (
              <div className="space-y-5">
                {/* Selected App Details Summary */}
                <div className="p-5 rounded-2xl card-gradient border border-white/8 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-blue-450 px-2 py-0.5 rounded bg-blue-950/45 border border-blue-900/60">
                        Permohonan Terpilih
                      </span>
                      <h3 className="font-bold text-sm text-slate-100 pt-1.5">
                        Penerbitan Paspor 48 hal
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pemohon</p>
                      <p className="text-xs font-bold text-slate-200">{selectedApp.full_name} ({selectedApp.nik})</p>
                    </div>
                  </div>
                </div>

                {/* Fee breakdown */}
                <div className="p-6 rounded-2xl card-gradient border border-white/8">
                  <h2 className="font-bold mb-4 flex items-center gap-2 text-slate-100">
                    <CreditCard className="w-4 h-4 text-blue-400" /> Rincian Biaya
                  </h2>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'Biaya Penerbitan Paspor 48 hal', value: 'Rp 350.000' },
                      { label: 'Biaya Layanan Digital', value: 'Rp 0 (Gratis)' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between py-2 border-b border-white/8">
                        <span className="text-slate-350 font-medium">{item.label}</span>
                        <span className="font-semibold text-slate-100">{item.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1">
                      <span className="font-bold text-slate-100">Total</span>
                      <span className="font-extrabold text-lg text-blue-400">Rp 350.000</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info Card or Checkout Card */}
                {!payment ? (
                  /* Checkout Card */
                  <div className="p-6 rounded-2xl card-gradient border border-white/8 space-y-5">
                    <h2 className="font-bold flex items-center gap-2 text-slate-100">
                      <Zap className="w-4 h-4 text-blue-400" /> Pilih Metode Pembayaran
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {PAYMENT_CHANNELS.map(ch => (
                        <button key={ch.id} id={`pay-channel-${ch.id}`} onClick={() => setChannel(ch.id)}
                          className={`p-3 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer`}
                          style={channel === ch.id
                            ? { background: `${ch.color}22`, border: `1px solid ${ch.color}60`, color: ch.color }
                            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1' }}>
                          {ch.label}
                        </button>
                      ))}
                    </div>
                    <button id="payment-initiate-btn" onClick={handleInitiate} disabled={initiating}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-white btn-glow disabled:opacity-50 transition-all cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                      {initiating
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Membuat Tagihan...</>
                        : <><CreditCard className="w-4 h-4" />Buat Tagihan Pembayaran</>}
                    </button>
                  </div>
                ) : (
                  /* Payment Details and Simulator Card */
                  <div className="space-y-5">
                    {/* Payment status */}
                    <div className="p-6 rounded-2xl card-gradient border border-white/8">
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="font-bold text-slate-100">Status Pembayaran</h2>
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                          ${payment.status === 'Verified' ? 'status-ready' : payment.status === 'Failed' ? 'status-pending' : 'status-verified'}`}>
                          {payment.status === 'Verified' ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-400" />Terverifikasi</>
                           : payment.status === 'Failed' ? <><XCircle className="w-3.5 h-3.5 text-red-400" />Gagal</>
                           : <><Clock className="w-3.5 h-3.5 text-blue-400" />Menunggu Pembayaran</>}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-white/8">
                          <span className="text-slate-350 font-medium">Jumlah</span>
                          <span className="font-bold text-slate-100">Rp {payment.amount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-white/8 items-center">
                          <span className="text-slate-350 font-medium">Kode Referensi</span>
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-blue-400 font-bold font-mono">{payment.reference_id}</code>
                            <button id="copy-ref-btn" onClick={copyRef} className="text-slate-300 hover:text-blue-400 transition-colors cursor-pointer">
                              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        {payment.paid_at && (
                          <div className="flex justify-between py-2">
                            <span className="text-slate-350 font-medium">Dibayar pada</span>
                            <span className="font-semibold text-slate-100">{new Date(payment.paid_at).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Webhook simulator */}
                    {payment.status === 'Pending' && (
                      <div className="p-6 rounded-2xl border animate-fade-in shadow-sm"
                        style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.18)' }}>
                        <div className="flex items-start gap-3 mb-5">
                          <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-bold text-blue-400 mb-1">Simulasi Pembayaran (Demo)</h3>
                            <p className="text-xs text-slate-300 font-medium leading-relaxed">
                              Tekan tombol di bawah untuk mensimulasikan notifikasi webhook dari payment gateway.
                              Backend akan menerima callback, memverifikasi tanda tangan, dan otomatis mengubah status pembayaran ke <strong className="text-white">Verified</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1">
                            <select id="payment-sim-channel"
                              value={channel} onChange={e => setChannel(e.target.value)}
                              className="input-field text-xs text-slate-100">
                              {PAYMENT_CHANNELS.map(ch => (
                                <option key={ch.id} value={ch.id} className="bg-slate-900">{ch.label}</option>
                              ))}
                            </select>
                          </div>
                          <button id="payment-simulate-btn" onClick={handleSimulatePayment} disabled={simulating || polling}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white btn-glow disabled:opacity-60 transition-all cursor-pointer bg-blue-600 border-none"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                            {simulating || polling
                              ? <><Loader2 className="w-4 h-4 animate-spin" /> {polling ? 'Memverifikasi...' : 'Mengirim Callback...'}</>
                              : <><CheckCircle className="w-4 h-4" /> Bayar Sekarang (Simulasi Webhook)</>}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Verification success alert */}
                    {payment.status === 'Verified' && (
                      <div className="flex items-center gap-3 p-5 rounded-2xl animate-fade-in"
                        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                        <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                        <div className="text-sm font-semibold">
                          <p className="text-emerald-400">Pembayaran Berhasil! 🥳</p>
                          <p className="text-slate-350 text-xs mt-0.5 font-medium">Permohonan Anda kini sedang diproses. Cek status di halaman <a href="/tracker" className="text-blue-400 font-bold underline">Lacak Status</a>.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Empty state placeholder on the right side if no application selected */
              <div className="flex flex-col items-center justify-center p-8 text-center card-gradient rounded-3xl border border-white/8 min-h-[450px] animate-fade-in">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 animate-pulse-glow"
                  style={{ background: 'rgba(9, 125, 233, 0.08)', border: '1px solid rgba(9, 125, 233, 0.2)' }}>
                  <CreditCard className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="font-bold text-lg text-slate-200">
                  {activeTab === 'unpaid' ? 'Pilih Tagihan Pembayaran' : 'Pilih Bukti Transaksi'}
                </h3>
                <p className="text-slate-350 text-sm max-w-sm mt-2">
                  {activeTab === 'unpaid'
                    ? 'Silakan pilih salah satu tagihan paspor di sebelah kiri untuk melihat rincian biaya dan melanjutkan pembayaran.'
                    : 'Silakan pilih salah satu bukti riwayat pembayaran di sebelah kiri untuk melihat bukti transfer lunas dan kode referensi Anda.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Section: Payment Information Grid */}
      <div className="pt-8 border-t border-white/8 animate-fade-in-up stagger-3">
        <h2 className="text-base font-bold mb-4 text-slate-200">Informasi & Panduan Pembayaran</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-xs font-bold text-slate-200">Verifikasi Instan</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pembayaran Anda diverifikasi secara otomatis dalam hitungan detik setelah transaksi berhasil diselesaikan.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-xs font-bold text-slate-200">Metode Pembayaran Lengkap</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mendukung berbagai metode pembayaran mulai dari Virtual Account Bank (BCA, Mandiri), GoPay, OVO, hingga QRIS.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-xs font-bold text-slate-200">Unduh Bukti Resmi</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Setelah pembayaran berhasil, bukti resmi berupa invoice dan kode referensi dapat diakses kapan saja di riwayat pembayaran.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600/10 border border-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-xs font-bold text-slate-200">Bantuan 24 Jam</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mengalami kendala? Tim customer service kami siap membantu Anda menyelesaikan masalah transaksi pembayaran.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 font-medium">Memuat...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
