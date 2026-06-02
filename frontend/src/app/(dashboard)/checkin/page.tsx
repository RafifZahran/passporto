'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MapPin, Navigation, CheckCircle, AlertCircle, Loader2, Target, Radar, Building2, User, ChevronRight, ArrowLeft,
  Clock, Shield, Info, PhoneCall
} from 'lucide-react';
import { checkInApi, applicationsApi } from '@/lib/api';
import type { CheckInResult, Application, ImmigrationOffice } from '@/lib/types';

const DEMO_OFFICES: ImmigrationOffice[] = [
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', name: 'Kanim Jakarta Selatan', code: 'KANIM_JAKSEL', address: 'Jl. Warung Buncit Raya No.207, Jakarta Selatan', latitude: -6.2615, longitude: 106.8106 },
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', name: 'Kanim Jakarta Pusat', code: 'KANIM_JAKPUS', address: 'Jl. Merpati Blok B-3, Jakarta Pusat', latitude: -6.1775, longitude: 106.8670 },
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', name: 'Kanim Soekarno-Hatta', code: 'KANIM_SOETTA', address: 'Bandara Internasional Soekarno-Hatta, Tangerang', latitude: -6.1256, longitude: 106.6558 },
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', name: 'Kanim Surabaya', code: 'KANIM_SBY', address: 'Jl. Juanda No.26, Surabaya', latitude: -7.2491, longitude: 112.7508 },
];

function CheckInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appId = searchParams.get('app') || '';
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [fetchingApps, setFetchingApps] = useState(true);
  const [manualCoords, setManualCoords] = useState({ lat: '', lon: '' });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState('');

  const eligibleApps = applications.filter(a => a.status === 'Verified' && !a.queue_number);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) { setError('Browser tidak mendukung geolokasi.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setManualCoords({ lat: pos.coords.latitude.toString(), lon: pos.coords.longitude.toString() });
        setLocating(false);
      },
      () => { setError('Gagal mendapatkan lokasi. Aktifkan izin lokasi atau masukkan koordinat manual.'); setLocating(false); }
    );
  }, []);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await applicationsApi.getAll();
        const apps: Application[] = res.data.applications || [];
        setApplications(apps);
        
        const eligible = apps.filter(a => a.status === 'Verified' && !a.queue_number);
        if (appId) {
          const match = eligible.find(a => a.id === appId);
          if (match) setSelectedApp(match);
        } else if (eligible.length === 1) {
          setSelectedApp(eligible[0]);
        }
      } catch (err) {
        console.error('Failed to load applications for check-in:', err);
      } finally {
        setFetchingApps(false);
      }
    };
    fetchApps();
  }, [appId]);

  useEffect(() => {
    if (selectedApp) {
      setError('');
      setResult(null);
      detectLocation();
    }
  }, [selectedApp, detectLocation]);

  const handleCheckIn = async () => {
    setError(''); setResult(null);
    if (!selectedApp) { setError('Pilih permohonan terlebih dahulu.'); return; }
    if (!manualCoords.lat || !manualCoords.lon) { setError('Masukkan atau deteksi koordinat GPS Anda.'); return; }
    setLoading(true);
    try {
      const res = await checkInApi.checkIn(selectedApp.id, parseFloat(manualCoords.lat), parseFloat(manualCoords.lon));
      setResult(res.data);
      if (res.data.success) {
        setTimeout(() => {
          router.push(`/tracker?id=${selectedApp.id}`);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Check-in gagal. Pastikan permohonan Anda sudah terverifikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto text-slate-100">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold mb-1 text-slate-100">Check-in GPS</h1>
        <p className="text-slate-300 text-sm">Konfirmasi kehadiran Anda di kantor imigrasi untuk mendapatkan nomor antrean.</p>
      </div>

      {/* Info card */}
      <div className="flex items-start gap-4 p-5 rounded-2xl mb-6 animate-fade-in-up stagger-1"
        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <Target className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-bold text-blue-400 mb-1">Validasi Lokasi Otomatis</p>
          <p className="text-slate-200 font-medium">Sistem akan mengukur jarak Anda dari kantor imigrasi menggunakan formula Haversine. Anda harus berada dalam radius <strong className="text-white font-extrabold">100 meter</strong> dari kantor.</p>
        </div>
      </div>

      <div className="space-y-5 animate-fade-in-up stagger-2">
        {fetchingApps ? (
          <div className="flex flex-col items-center justify-center p-12 card-gradient rounded-2xl border border-white/8">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-slate-400 font-semibold">Memeriksa permohonan aktif...</p>
          </div>
        ) : eligibleApps.length === 0 ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center justify-center p-10 text-center card-gradient rounded-3xl border border-white/8 min-h-[280px]">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 animate-pulse-glow"
                style={{ background: 'rgba(9, 125, 233, 0.08)', border: '1px solid rgba(9, 125, 233, 0.2)' }}>
                <Radar className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-bold text-lg text-slate-100">Tidak Ada Permohonan Siap Check-in</h3>
              <p className="text-slate-350 text-sm max-w-md mt-2">
                Saat ini Anda tidak memiliki permohonan paspor aktif yang siap melakukan check-in lokasi. Pastikan pembayaran permohonan Anda telah lunas dan terverifikasi.
              </p>
              <a href="/tracker" className="mt-5 px-6 py-3 rounded-xl font-bold text-white btn-glow transition-all text-sm"
                style={{ background: 'linear-gradient(135deg, #097DE9, #FCBB13)' }}>
                Lacak Status Permohonan
              </a>
            </div>

            {/* Kantor Imigrasi Terdekat */}
            <div className="p-6 rounded-2xl card-gradient border border-white/8 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm text-slate-200">Kantor Imigrasi Terdaftar</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEMO_OFFICES.map(office => (
                  <div key={office.id} className="p-4 rounded-xl space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="font-bold text-sm text-slate-200">{office.name}</p>
                    <p className="text-[11px] text-slate-450 font-medium leading-relaxed">{office.address}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono font-medium pt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {office.latitude}, {office.longitude}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Clock, color: '#3b82f6', title: 'Jam Operasional', desc: 'Senin–Jumat 08.00–15.00 WIB. Sabtu–Minggu & hari libur tutup.' },
                { icon: Shield, color: '#10b981', title: 'Radius Check-in', desc: 'Anda harus berada dalam radius 100 meter dari kantor imigrasi.' },
                { icon: PhoneCall, color: '#f59e0b', title: 'Bantuan Teknis', desc: 'Hubungi hotline 1500-455 untuk kendala check-in GPS.' },
              ].map(card => (
                <div key={card.title} className="p-5 rounded-2xl card-gradient border border-white/8 space-y-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}>
                    <card.icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                  <p className="font-bold text-sm text-slate-200">{card.title}</p>
                  <p className="text-xs text-slate-450 leading-relaxed font-medium">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : !selectedApp ? (
          /* Multiple applications selection screen */
          <div className="space-y-4">
            <div className="p-5 rounded-2xl card-gradient border border-white/8">
              <h3 className="font-bold text-sm text-slate-200 mb-2 uppercase tracking-wide">Pilih Permohonan yang Ingin Di-check-in</h3>
              <p className="text-xs text-slate-450">Pilih salah satu dari {eligibleApps.length} permohonan aktif Anda di bawah ini:</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {eligibleApps.map(app => {
                const officeName = DEMO_OFFICES.find(o => o.id === app.office_id)?.name || 'Kantor Imigrasi';
                return (
                  <button key={app.id} onClick={() => setSelectedApp(app)}
                    className="w-full flex items-center justify-between p-5 rounded-2xl text-left border border-white/8 bg-white/3 hover:bg-white/5 hover:border-blue-500/35 transition-all cursor-pointer group">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-sm text-slate-100">{officeName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.full_name}</span>
                        <span className="text-slate-500">•</span>
                        <span>NIK: {app.nik}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Check-in detail form for selected application */
          <div className="space-y-5">
            {/* Selected App Detail Panel */}
            <div className="p-6 rounded-2xl card-gradient border border-white/8 flex items-center justify-between">
              <div className="min-w-0 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-950/45 border border-blue-900/60">
                  Permohonan Terpilih
                </span>
                <h3 className="font-bold text-base text-slate-100 pt-1">
                  {DEMO_OFFICES.find(o => o.id === selectedApp.office_id)?.name || 'Kantor Imigrasi'}
                </h3>
                <p className="text-xs text-slate-300 font-semibold">
                  Pemohon: {selectedApp.full_name} ({selectedApp.nik})
                </p>
              </div>
              {eligibleApps.length > 1 && (
                <button onClick={() => setSelectedApp(null)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/8 hover:bg-white/10 text-slate-300 transition-all cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" /> Ubah Pilihan
                </button>
              )}
            </div>

            {/* GPS Coordinates */}
            <div className="p-6 rounded-2xl card-gradient border border-white/8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-slate-100">Koordinat GPS</span>
                </div>
                <button id="checkin-detect-btn" onClick={detectLocation} disabled={locating}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 border border-white/8 shadow-sm hover:bg-white/10 text-slate-200 transition-all cursor-pointer">
                  {locating
                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Mendeteksi...</>
                    : <><Radar className="w-3 h-3" /> Deteksi Otomatis</>}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 mb-2 font-semibold">Latitude</label>
                  <input id="checkin-lat" type="number" step="any" placeholder="-6.2615"
                    value={manualCoords.lat} onChange={e => setManualCoords({ ...manualCoords, lat: e.target.value })}
                    className="input-field font-mono text-sm text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-2 font-semibold">Longitude</label>
                  <input id="checkin-lon" type="number" step="any" placeholder="106.8106"
                    value={manualCoords.lon} onChange={e => setManualCoords({ ...manualCoords, lon: e.target.value })}
                    className="input-field font-mono text-sm text-slate-100" />
                </div>
              </div>

              {/* Demo hint */}
              <p className="text-xs text-slate-300 font-medium">
                💡 Demo: gunakan koordinat Kanim Jaksel (<code className="text-blue-400 font-bold font-mono">-6.2615, 106.8106</code>) untuk check-in berhasil.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl text-sm animate-fade-in"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className={`p-6 rounded-2xl animate-fade-in`}
                style={result.success
                  ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }
                  : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <div className="flex items-center gap-3 mb-4">
                  {result.success
                    ? <CheckCircle className="w-6 h-6 text-emerald-400" />
                    : <AlertCircle className="w-6 h-6 text-red-400" />}
                  <span className={`font-bold ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {result.success ? 'Check-in Berhasil!' : 'Check-in Ditolak'}
                  </span>
                </div>
                <p className="text-sm mb-4 font-semibold text-slate-200">{result.message}</p>
                <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
                  <div>
                    <p className="text-xs text-slate-300 mb-1 font-bold">Jarak dari Kantor</p>
                    <p className="font-extrabold text-slate-100 text-lg">{result.distance_meters.toFixed(0)}m</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 mb-1 font-bold">Radius Diizinkan</p>
                    <p className="font-extrabold text-slate-100 text-lg">{result.allowed_radius_meters}m</p>
                  </div>
                  {result.queue_number && (
                    <div className="col-span-2 text-center pt-2">
                      <p className="text-xs text-slate-300 mb-2 font-bold">Nomor Antrean Anda</p>
                      <div className="inline-block px-8 py-3 rounded-2xl"
                        style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)' }}>
                        <p className="text-3xl font-black gradient-text-blue">{result.queue_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button id="checkin-submit-btn" onClick={handleCheckIn} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-white btn-glow disabled:opacity-60 transition-all cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Memverifikasi Lokasi...</>
                : <><MapPin className="w-5 h-5" /> Check-in Sekarang</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 font-medium">Memuat...</div>}>
      <CheckInContent />
    </Suspense>
  );
}
