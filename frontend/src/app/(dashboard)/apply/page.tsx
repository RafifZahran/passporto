'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Building2, Calendar, ChevronRight, CheckCircle,
  AlertCircle, Loader2, TrendingDown, Users, Star
} from 'lucide-react';
import OCRUpload from '@/components/OCRUpload';
import { applicationsApi, officesApi } from '@/lib/api';
import type { OCRExtractedData, ImmigrationOffice, SlotPrediction } from '@/lib/types';

// Static office list for demo (Step 5 will fetch from API)
const DEMO_OFFICES: ImmigrationOffice[] = [
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', name: 'Kanim Jakarta Selatan', code: 'KANIM_JAKSEL', address: 'Jl. Warung Buncit Raya No.207, Jakarta Selatan', latitude: -6.2615, longitude: 106.8106 },
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', name: 'Kanim Jakarta Pusat', code: 'KANIM_JAKPUS', address: 'Jl. Merpati Blok B-3, Jakarta Pusat', latitude: -6.1775, longitude: 106.8670 },
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', name: 'Kanim Soekarno-Hatta', code: 'KANIM_SOETTA', address: 'Bandara Internasional Soekarno-Hatta, Tangerang', latitude: -6.1256, longitude: 106.6558 },
  { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', name: 'Kanim Surabaya', code: 'KANIM_SBY', address: 'Jl. Juanda No.26, Surabaya', latitude: -7.2491, longitude: 112.7508 },
];

// Generate 14 days of mock slot predictions
function generateMockSlots(officeId: string): SlotPrediction[] {
  return Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const capacity = 50;
    const filled = Math.floor(Math.random() * 50);
    return {
      date: date.toISOString().split('T')[0],
      capacity,
      filled,
      available: capacity - filled,
      occupancy_percent: Math.round((filled / capacity) * 100),
      recommended: filled / capacity < 0.5,
    };
  });
}

const STEPS = ['Identitas', 'Kantor & Jadwal', 'Konfirmasi'];

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    nik: '', full_name: '', birth_date: '', gender: '', address: '',
    office_id: '', slot_date: '',
  });
  const [slots, setSlots] = useState<SlotPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const selectedOffice = DEMO_OFFICES.find(o => o.id === form.office_id);
  const selectedSlot = slots.find(s => s.date === form.slot_date);

  const handleOCR = (data: OCRExtractedData) => {
    setForm(prev => ({ ...prev, ...data }));
  };

  const handleOfficeSelect = (officeId: string) => {
    setForm(prev => ({ ...prev, office_id: officeId, slot_date: '' }));
    // Load mock slots (Step 5 will replace with real API)
    setSlots(generateMockSlots(officeId));
  };

  const handleNext = () => {
    if (step === 0 && (!form.nik || !form.full_name || !form.birth_date || !form.gender || !form.address)) {
      setError('Lengkapi semua field identitas terlebih dahulu.'); return;
    }
    if (step === 1 && (!form.office_id || !form.slot_date)) {
      setError('Pilih kantor imigrasi dan tanggal kunjungan.'); return;
    }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await applicationsApi.create({
        office_id: form.office_id,
        slot_date: form.slot_date,
        nik: form.nik,
        full_name: form.full_name,
        birth_date: form.birth_date,
        gender: form.gender,
        address: form.address,
      });
      setSuccess(true);
      setTimeout(() => router.push('/tracker'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Permohonan gagal diajukan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 text-[#4A4A4A]">
        <div className="text-center animate-fade-in-up">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"
            style={{ background: 'rgba(81, 151, 85, 0.08)', border: '1px solid rgba(81, 151, 85, 0.2)' }}>
            <CheckCircle className="w-10 h-10 text-[#519755]" />
          </div>
          <h2 className="text-2xl font-serif text-[#4A4A4A] mb-3 font-normal">Permohonan Berhasil Diajukan!</h2>
          <p className="text-[#777777] mb-2 font-medium">Kami akan memproses permohonan paspor Anda.</p>
          <p className="text-[#aaaaaa] text-sm font-medium">Mengalihkan ke halaman pelacak status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto text-[#4A4A4A]">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-serif text-[#4A4A4A] mb-1 font-normal">Ajukan Paspor Baru</h1>
        <p className="text-[#777777] text-sm">Lengkapi formulir berikut untuk mengajukan permohonan paspor.</p>
      </div>

      <div className="flex items-center gap-3 mb-8 animate-fade-in-up stagger-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-3 flex-1">
            <div className={`flex items-center gap-2 flex-shrink-0`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${i < step ? 'bg-[#519755] text-white' : i === step ? 'text-[#FFFFE3] font-extrabold bg-[#292966]' : 'text-[#777777]'}
              `} style={i === step ? {} : i < step ? {} : { background: 'rgba(74,74,74,0.08)', border: '1px solid rgba(74,74,74,0.15)' }}>
                {i < step ? <CheckCircle className="w-4 h-4 text-white" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i === step ? 'text-[#292966] font-bold' : i < step ? 'text-[#519755] font-bold' : 'text-[#777777] font-bold opacity-85'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? 'bg-[#519755]/50' : 'bg-[rgba(74,74,74,0.1)]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-6 text-sm animate-fade-in"
          style={{ background: 'rgba(227, 83, 54, 0.08)', border: '1px solid rgba(227, 83, 54, 0.2)', color: '#E35336' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Step 0: Identitas ───────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6 animate-fade-in">
          {/* OCR Upload */}
          <div className="p-6 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm">
            <OCRUpload onExtracted={handleOCR} />
          </div>

          {/* Manual form */}
          <div className="p-6 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] space-y-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-[#292966]" />
              <span className="text-sm font-bold text-[#4A4A4A]">Data Identitas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#4A4A4A] mb-2 uppercase tracking-wide">NIK (16 digit)</label>
                <input id="form-nik" type="text" maxLength={16} placeholder="3201010101010001"
                  value={form.nik} onChange={e => setForm({ ...form, nik: e.target.value })}
                  className="input-field font-mono text-[#4A4A4A] placeholder:text-[#CBCBCB]" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#4A4A4A] mb-2 uppercase tracking-wide">Nama Lengkap</label>
                <input id="form-full-name" type="text" placeholder="Sesuai KTP"
                  value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="input-field text-[#4A4A4A] placeholder:text-[#CBCBCB]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A4A] mb-2 uppercase tracking-wide">Tanggal Lahir</label>
                <input id="form-birth-date" type="date"
                  value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })}
                  className="input-field text-[#4A4A4A]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4A4A4A] mb-2 uppercase tracking-wide">Jenis Kelamin</label>
                <select id="form-gender" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                  className="input-field text-[#4A4A4A]">
                  <option value="">Pilih...</option>
                  <option value="Laki-Laki">Laki-Laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#4A4A4A] mb-2 uppercase tracking-wide">Alamat Sesuai KTP</label>
                <textarea id="form-address" rows={3} placeholder="Jl. ..."
                  value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="input-field resize-none text-[#4A4A4A] placeholder:text-[#CBCBCB]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Kantor & Jadwal ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          {/* Office selector */}
          <div className="p-6 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-[#292966]" />
              <span className="text-sm font-bold text-[#4A4A4A]">Pilih Kantor Imigrasi</span>
            </div>
            <div className="space-y-3">
              {DEMO_OFFICES.map((office) => (
                <button key={office.id} id={`office-${office.code}`}
                  onClick={() => handleOfficeSelect(office.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl text-left shadow-sm transition-all cursor-pointer bg-white border ${form.office_id === office.id ? 'border-[#292966]' : 'border-[rgba(74,74,74,0.12)]'}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                    ${form.office_id === office.id ? 'bg-[#6D8196]/10' : 'bg-transparent'}`}>
                    <Building2 className={`w-4 h-4 ${form.office_id === office.id ? 'text-[#292966]' : 'text-[#CBCBCB]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${form.office_id === office.id ? 'text-[#292966]' : 'text-[#4A4A4A]'}`}>{office.name}</p>
                    <p className="text-xs text-[#777777] mt-0.5 truncate font-medium">{office.address}</p>
                  </div>
                  {form.office_id === office.id && <CheckCircle className="w-4 h-4 text-[#292966] flex-shrink-0 mt-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* Slot predictor */}
          {slots.length > 0 && (
            <div className="p-6 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-[#292966]" />
                <span className="text-sm font-bold text-[#4A4A4A]">Slot Tersedia — Pilih Tanggal</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {slots.map((slot) => {
                  const isSelected = form.slot_date === slot.date;
                  const isFull = slot.available === 0;
                  return (
                    <button key={slot.date} id={`slot-${slot.date}`} disabled={isFull}
                      onClick={() => setForm(prev => ({ ...prev, slot_date: slot.date }))}
                      className={`p-3 rounded-2xl text-left text-xs shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white border ${isSelected ? 'border-[#292966]' : 'border-[rgba(74,74,74,0.12)]'}`}>
                      <p className="font-bold text-sm text-[#4A4A4A] mb-1">
                        {new Date(slot.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[#777777] font-medium">
                          <Users className="w-3 h-3" />{slot.available}/{slot.capacity}
                        </span>
                        {slot.recommended && !isFull && (
                          <span className="flex items-center gap-0.5 text-[#519755]">
                            <Star className="w-3 h-3 text-[#519755] fill-[#519755]" />
                          </span>
                        )}
                      </div>
                      {/* Occupancy bar */}
                      <div className="mt-2 h-1.5 rounded-full bg-[rgba(74,74,74,0.05)] overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${slot.occupancy_percent}%`,
                            backgroundColor: slot.occupancy_percent > 80 ? '#E35336' : slot.occupancy_percent > 50 ? '#54663A' : '#519755'
                          }} />
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#777777] mt-3 flex items-center gap-1 font-medium">
                <Star className="w-3 h-3 text-[#519755] fill-[#519755]" /> = Slot direkomendasikan (kuota tersedia banyak)
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Konfirmasi ───────────────────────────────────────────── */}
      {step === 2 && (
        <div className="p-6 rounded-2xl bg-white border border-[rgba(74,74,74,0.12)] space-y-5 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-[#519755]" />
            <span className="text-sm font-bold text-[#4A4A4A]">Konfirmasi Permohonan</span>
          </div>
          <div className="space-y-3 text-sm">
            {[
              { label: 'NIK', value: form.nik },
              { label: 'Nama Lengkap', value: form.full_name },
              { label: 'Tanggal Lahir', value: form.birth_date },
              { label: 'Jenis Kelamin', value: form.gender },
              { label: 'Kantor Imigrasi', value: selectedOffice?.name },
              { label: 'Tanggal Kunjungan', value: form.slot_date ? new Date(form.slot_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '' },
            ].map(f => f.value && (
              <div key={f.label} className="flex justify-between py-2 border-b border-[rgba(74,74,74,0.08)]">
                <span className="text-[#777777] font-medium">{f.label}</span>
                <span className="font-semibold text-right ml-4 text-[#4A4A4A]">{f.value}</span>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl text-xs text-[#6D8196] font-medium"
            style={{ background: 'rgba(109,129,150,0.05)', border: '1px solid rgba(109,129,150,0.15)' }}>
            Dengan mengajukan permohonan ini, Anda menyatakan bahwa data yang diberikan adalah benar dan sesuai dokumen resmi.
          </div>
        </div>
      )}

      {/* ── Navigation Buttons ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-8">
        {step > 0 ? (
          <button id="form-back-btn" onClick={() => setStep(s => Math.max(0, s - 1))}
            className="px-6 py-3 rounded-xl text-sm font-bold text-[#4A4A4A] hover:text-black hover:bg-[rgba(74,74,74,0.05)] transition-all cursor-pointer">
            ← Kembali
          </button>
        ) : (
          <div className="w-24" />
        )}

        {step < 2 ? (
          <button id="form-next-btn" onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-[#FFFFE3] bg-[#4A4A4A] hover:bg-[#333333] border-none btn-glow transition-all cursor-pointer">
            Lanjut <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button id="form-submit-btn" onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-[#FFFFE3] bg-[#4A4A4A] hover:bg-[#333333] border-none btn-glow disabled:opacity-60 transition-all cursor-pointer">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {loading ? 'Mengajukan...' : 'Ajukan Permohonan'}
          </button>
        )}
      </div>
    </div>
  );
}
