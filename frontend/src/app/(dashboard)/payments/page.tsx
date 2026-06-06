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
  const [justPaidAppIds, setJustPaidAppIds] = useState<string[]>([]);
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
        
        // Mark as just paid to show success alert
        setJustPaidAppIds(prev => [...prev, selectedAppId]);
        
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
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 text-[#4A4A4A]">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-serif text-[#4A4A4A] mb-1 font-normal">Pembayaran</h1>
        <p className="text-[#777777] text-sm font-medium">Kelola tagihan aktif dan riwayat bukti pembayaran paspor Anda.</p>
      </div>

      {currentTabIsEmpty ? (
        <div className="space-y-6 animate-fade-in-up stagger-1">
          {/* Tabs Selector (Centered / Compact) */}
          <div className="max-w-md mx-auto">
            <div className="flex gap-2 p-1 bg-[rgba(74,74,74,0.04)] border border-[rgba(74,74,74,0.08)] rounded-xl">
              <button
                onClick={() => {
                  setActiveTab('unpaid');
                  const unpaid = applications.filter((a: Application) => a.status === 'Pending');
                  setSelectedAppId(unpaid.length > 0 ? unpaid[0].id : null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'unpaid'
                    ? 'bg-[#292966]/10 border border-[#292966]/20 text-[#292966]'
                    : 'text-[#777777] hover:text-[#4A4A4A]'
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
                    ? 'bg-[#292966]/10 border border-[#292966]/20 text-[#292966]'
                    : 'text-[#777777] hover:text-[#4A4A4A]'
                }`}
              >
                Riwayat Pembayaran ({paidApps.length})
              </button>
            </div>
          </div>

          {/* Centered Empty State Card */}
          <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-[rgba(74,74,74,0.12)] min-h-[350px] max-w-xl mx-auto space-y-4 shadow-sm animate-fade-in">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
              style={{
                background: activeTab === 'unpaid' ? 'rgba(81, 151, 85, 0.08)' : 'rgba(109, 129, 150, 0.08)',
                border: activeTab === 'unpaid' ? '1px solid rgba(81, 151, 85, 0.2)' : '1px solid rgba(109, 129, 150, 0.2)'
              }}>
              {activeTab === 'unpaid' ? (
                <CheckCircle className="w-8 h-8 text-[#519755]" />
              ) : (
                <Clock className="w-8 h-8 text-[#6D8196]" />
              )}
            </div>
            <h3 className="font-bold text-lg text-[#4A4A4A]">
              {activeTab === 'unpaid' ? 'Tidak Ada Tagihan Aktif' : 'Belum Ada Riwayat Pembayaran'}
            </h3>
            <p className="text-[#777777] text-xs max-w-md leading-relaxed">
              {activeTab === 'unpaid'
                ? 'Semua pengajuan paspor Anda telah dibayar atau tidak ada pengajuan baru yang membutuhkan tindakan pembayaran.'
                : 'Anda belum memiliki riwayat transaksi pembayaran paspor. Silakan selesaikan pembayaran tagihan aktif Anda.'}
            </p>
            <div className="pt-2">
              <button
                onClick={() => router.push(activeTab === 'unpaid' ? '/tracker' : '/apply')}
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-[#FFFFE3] bg-[#4A4A4A] hover:bg-[#333333] border-none btn-glow transition-all cursor-pointer"
              >
                {activeTab === 'unpaid' ? 'Lacak Status' : 'Ajukan Paspor'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Tabs and List */}
          <div className="lg:col-span-5 space-y-4 animate-fade-in-up stagger-1">
            {/* Tabs Selector */}
            <div className="flex gap-2 p-1 bg-[rgba(74,74,74,0.04)] border border-[rgba(74,74,74,0.08)] rounded-xl">
              <button
                onClick={() => {
                  setActiveTab('unpaid');
                  const unpaid = applications.filter((a: Application) => a.status === 'Pending');
                  setSelectedAppId(unpaid.length > 0 ? unpaid[0].id : null);
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'unpaid'
                    ? 'bg-[#292966]/10 border border-[#292966]/20 text-[#292966]'
                    : 'text-[#777777] hover:text-[#4A4A4A]'
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
                    ? 'bg-[#292966]/10 border border-[#292966]/20 text-[#292966]'
                    : 'text-[#777777] hover:text-[#4A4A4A]'
                }`}
              >
                Riwayat Pembayaran ({paidApps.length})
              </button>
            </div>

            <div className="space-y-2">
              {(activeTab === 'unpaid' ? unpaidApps : paidApps).map(app => {
                const isActive = selectedAppId === app.id;
                const isPaid = app.status !== 'Pending';
                return (
                  <button key={app.id} onClick={() => setSelectedAppId(app.id)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl text-left shadow-sm transition-all cursor-pointer relative overflow-hidden"
                    style={isActive ? {
                      background: 'rgba(109,129,150,0.06)',
                      border: '1px solid rgba(109,129,150,0.3)',
                    } : {
                      background: '#ffffff',
                      border: '1px solid rgba(74,74,74,0.12)',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background = '#fbfbf6';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(74,74,74,0.22)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background = '#ffffff';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(74,74,74,0.12)';
                      }
                    }}>
                    {/* Active accent strip on the left */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#292966]" />
                    )}
                    <div className="min-w-0 space-y-1 pl-1">
                      <p className={`font-bold text-xs ${isActive ? 'text-[#292966]' : 'text-[#4A4A4A]'}`}>{app.full_name}</p>
                      <p className="text-[10px] text-[#777777]">NIK: {app.nik}</p>
                    </div>
                    <span className={`font-extrabold text-xs flex-shrink-0 ${isPaid ? 'text-[#519755]' : 'text-[#292966]'}`}>
                      {isPaid ? 'Lunas' : 'Rp 350K'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Checkout or Receipt details */}
          <div className="lg:col-span-7 space-y-5 animate-fade-in-up stagger-2">
            {selectedApp ? (
              <div className="space-y-5">
                {/* Selected App Details Summary */}
                <div className="p-5 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#292966] px-2 py-0.5 rounded bg-[#292966]/10 border border-[#292966]/20">
                        Permohonan Terpilih
                      </span>
                      <h3 className="font-bold text-sm text-[#4A4A4A] pt-1.5">
                        Penerbitan Paspor 48 hal
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#777777] uppercase tracking-wider">Pemohon</p>
                      <p className="text-xs font-bold text-[#4A4A4A]">{selectedApp.full_name} ({selectedApp.nik})</p>
                    </div>
                  </div>
                </div>

                {/* Fee breakdown */}
                <div className="p-6 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm">
                  <h2 className="font-bold mb-4 flex items-center gap-2 text-[#4A4A4A]">
                    <CreditCard className="w-4 h-4 text-[#292966]" /> Rincian Biaya
                  </h2>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'Biaya Penerbitan Paspor 48 hal', value: 'Rp 350.000' },
                      { label: 'Biaya Layanan Digital', value: 'Rp 0 (Gratis)' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between py-2 border-b border-[rgba(74,74,74,0.08)]">
                        <span className="text-[#777777] font-medium">{item.label}</span>
                        <span className="font-semibold text-[#4A4A4A]">{item.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1">
                      <span className="font-bold text-[#4A4A4A]">Total</span>
                      <span className="font-extrabold text-lg text-[#292966]">Rp 350.000</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info Card or Checkout Card */}
                {!payment ? (
                  /* Checkout Card */
                  <div className="p-6 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm space-y-5">
                    <h2 className="font-bold flex items-center gap-2 text-[#4A4A4A]">
                      <Zap className="w-4 h-4 text-[#292966]" /> Pilih Metode Pembayaran
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {PAYMENT_CHANNELS.map(ch => (
                        <button key={ch.id} id={`pay-channel-${ch.id}`} onClick={() => setChannel(ch.id)}
                          className={`p-3 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer`}
                          style={channel === ch.id
                            ? { background: `${ch.color}22`, border: `1px solid ${ch.color}60`, color: ch.color }
                            : { background: 'rgba(74,74,74,0.02)', border: '1px solid rgba(74,74,74,0.08)', color: '#777777' }}>
                          {ch.label}
                        </button>
                      ))}
                    </div>
                    <button id="payment-initiate-btn" onClick={handleInitiate} disabled={initiating}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-[#FFFFE3] bg-[#4A4A4A] hover:bg-[#333333] border-none btn-glow transition-all cursor-pointer">
                      {initiating
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Membuat Tagihan...</>
                        : <><CreditCard className="w-4 h-4" />Buat Tagihan Pembayaran</>}
                    </button>
                  </div>
                ) : (
                  /* Payment Details and Simulator Card */
                  <div className="space-y-5">
                    {/* Payment status */}
                    <div className="p-6 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm">
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="font-bold text-[#4A4A4A]">Status Pembayaran</h2>
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                          ${payment.status === 'Verified' ? 'bg-[#519755]/10 text-[#519755] border border-[#519755]/20' : payment.status === 'Failed' ? 'bg-[#E35336]/10 text-[#E35336] border border-[#E35336]/20' : 'bg-[#292966]/10 text-[#292966] border border-[#292966]/20'}`}>
                          {payment.status === 'Verified' ? <><CheckCircle className="w-3.5 h-3.5 text-[#519755]" />Terverifikasi</>
                           : payment.status === 'Failed' ? <><XCircle className="w-3.5 h-3.5 text-[#E35336]" />Gagal</>
                           : <><Clock className="w-3.5 h-3.5 text-[#292966]" />Menunggu Pembayaran</>}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-[rgba(74,74,74,0.08)]">
                          <span className="text-[#777777] font-medium">Jumlah</span>
                          <span className="font-bold text-[#4A4A4A]">Rp {payment.amount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[rgba(74,74,74,0.08)] items-center">
                          <span className="text-[#777777] font-medium">Kode Referensi</span>
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-[#292966] font-bold font-mono">{payment.reference_id}</code>
                            <button id="copy-ref-btn" onClick={copyRef} className="text-[#777777] hover:text-[#292966] transition-colors cursor-pointer">
                              {copied ? <CheckCircle className="w-3.5 h-3.5 text-[#519755]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        {payment.paid_at && (
                          <div className="flex justify-between py-2">
                            <span className="text-[#777777] font-medium">Dibayar pada</span>
                            <span className="font-semibold text-[#4A4A4A]">{new Date(payment.paid_at).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Webhook simulator */}
                    {payment.status === 'Pending' && (
                      <div className="p-6 rounded-2xl border animate-fade-in shadow-sm"
                        style={{ background: 'rgba(109,129,150,0.06)', border: '1px solid rgba(109,129,150,0.18)' }}>
                        <div className="flex items-start gap-3 mb-5">
                          <Zap className="w-5 h-5 text-[#292966] flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-bold text-[#292966] mb-1">Simulasi Pembayaran (Demo)</h3>
                            <p className="text-xs text-[#777777] font-medium leading-relaxed">
                              Tekan tombol di bawah untuk mensimulasikan notifikasi webhook dari payment gateway.
                              Backend akan menerima callback, memverifikasi tanda tangan, dan otomatis mengubah status pembayaran ke <strong className="text-[#4A4A4A]">Verified</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1">
                            <select id="payment-sim-channel"
                              value={channel} onChange={e => setChannel(e.target.value)}
                              className="input-field text-xs text-[#4A4A4A] bg-white border border-[rgba(74,74,74,0.15)]">
                              {PAYMENT_CHANNELS.map(ch => (
                                <option key={ch.id} value={ch.id} className="bg-white text-[#4A4A4A]">{ch.label}</option>
                              ))}
                            </select>
                          </div>
                          <button id="payment-simulate-btn" onClick={handleSimulatePayment} disabled={simulating || polling}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-[#FFFFE3] bg-[#4A4A4A] hover:bg-[#333333] border-none btn-glow disabled:opacity-60 transition-all cursor-pointer">
                            {simulating || polling
                              ? <><Loader2 className="w-4 h-4 animate-spin" /> {polling ? 'Memverifikasi...' : 'Mengirim Callback...'}</>
                              : <><CheckCircle className="w-4 h-4" /> Bayar Sekarang (Simulasi Webhook)</>}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Verification success alert */}
                    {payment.status === 'Verified' && selectedAppId && justPaidAppIds.includes(selectedAppId) && (
                      <div className="flex items-center gap-3 p-5 rounded-2xl animate-fade-in"
                        style={{ background: 'rgba(81, 151, 85, 0.08)', border: '1px solid rgba(81, 151, 85, 0.2)', color: '#519755' }}>
                        <CheckCircle className="w-6 h-6 text-[#519755] flex-shrink-0" />
                        <div className="text-sm font-semibold">
                          <p className="text-[#519755]">Pembayaran Berhasil! 🥳</p>
                          <p className="text-[#777777] text-xs mt-0.5 font-medium">Permohonan Anda kini sedang diproses. Cek status di halaman <a href="/tracker" className="text-[#292966] font-bold underline">Lacak Status</a>.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Empty state placeholder on the right side if no application selected */
              <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-[rgba(74,74,74,0.12)] min-h-[450px] shadow-sm animate-fade-in">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(109, 129, 150, 0.08)', border: '1px solid rgba(109, 129, 150, 0.2)' }}>
                  <CreditCard className="w-8 h-8 text-[#292966]" />
                </div>
                <h3 className="font-bold text-lg text-[#4A4A4A]">
                  {activeTab === 'unpaid' ? 'Pilih Tagihan Pembayaran' : 'Pilih Bukti Transaksi'}
                </h3>
                <p className="text-[#777777] text-sm max-w-sm mt-2">
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
      <div className="pt-8 border-t border-[rgba(74,74,74,0.12)] animate-fade-in-up stagger-3">
        <h2 className="text-base font-bold mb-4 text-[#4A4A4A]">Informasi & Panduan Pembayaran</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#292966]/10 border border-[#292966]/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#292966]" />
            </div>
            <h3 className="text-xs font-bold text-[#4A4A4A]">Verifikasi Instan</h3>
            <p className="text-[11px] text-[#777777] leading-relaxed">
              Pembayaran Anda diverifikasi secara otomatis dalam hitungan detik setelah transaksi berhasil diselesaikan.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#E35336]/10 border border-[#E35336]/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-[#E35336]" />
            </div>
            <h3 className="text-xs font-bold text-[#4A4A4A]">Metode Pembayaran Lengkap</h3>
            <p className="text-[11px] text-[#777777] leading-relaxed">
              Mendukung berbagai metode pembayaran mulai dari Virtual Account Bank (BCA, Mandiri), GoPay, OVO, hingga QRIS.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#519755]/10 border border-[#519755]/20 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-[#519755]" />
            </div>
            <h3 className="text-xs font-bold text-[#4A4A4A]">Unduh Bukti Resmi</h3>
            <p className="text-[11px] text-[#777777] leading-relaxed">
              Setelah pembayaran berhasil, bukti resmi berupa invoice dan kode referensi dapat diakses kapan saja di riwayat pembayaran.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#54663A]/10 border border-[#54663A]/20 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-[#54663A]" />
            </div>
            <h3 className="text-xs font-bold text-[#4A4A4A]">Bantuan 24 Jam</h3>
            <p className="text-[11px] text-[#777777] leading-relaxed">
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
    <Suspense fallback={<div className="p-8 text-[#777777] font-medium">Memuat...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
