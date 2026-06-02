'use client';

import { X, Shield, FileText, AlertCircle, CheckCircle, Globe } from 'lucide-react';

interface TermsModalProps {
  onClose: () => void;
}

const sections = [
  {
    icon: FileText,
    color: '#3b82f6',
    title: '1. Penerimaan Syarat',
    content: `Dengan mendaftar dan menggunakan layanan PassPorto, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku. Jika Anda tidak setuju dengan ketentuan ini, harap tidak menggunakan layanan kami.

PassPorto adalah platform digital untuk membantu Warga Negara Indonesia (WNI) dalam proses pengajuan paspor. Layanan ini bersifat gratis dan tersedia untuk seluruh WNI yang memenuhi syarat.`,
  },
  {
    icon: Shield,
    color: '#10b981',
    title: '2. Perlindungan Data Pribadi',
    content: `PassPorto berkomitmen menjaga kerahasiaan data pribadi Anda sesuai dengan Undang-Undang Pelindungan Data Pribadi (UU PDP) Indonesia.

Data yang kami kumpulkan:
• Nama lengkap, alamat email, dan Nomor Induk Kependudukan (NIK)
• Data permohonan paspor (foto KTP, informasi diri)
• Data lokasi GPS (hanya saat proses check-in di Kantor Imigrasi)

Data Anda TIDAK akan dijual, disewakan, atau dibagikan kepada pihak ketiga tanpa persetujuan eksplisit Anda, kecuali diwajibkan oleh hukum yang berlaku.`,
  },
  {
    icon: Globe,
    color: '#8b5cf6',
    title: '3. Penggunaan Layanan',
    content: `Anda setuju untuk menggunakan PassPorto hanya untuk tujuan yang sah dan sesuai hukum yang berlaku di Indonesia. Pengguna dilarang:

• Menyediakan informasi palsu, menyesatkan, atau tidak akurat
• Menggunakan layanan untuk tujuan penipuan atau manipulasi
• Mencoba mengakses sistem atau data pengguna lain tanpa izin
• Melakukan tindakan yang dapat mengganggu atau merusak layanan
• Menggunakan layanan atas nama orang lain tanpa kuasa yang sah

Pelanggaran terhadap ketentuan ini dapat mengakibatkan penangguhan atau penghentian akun Anda.`,
  },
  {
    icon: CheckCircle,
    color: '#f59e0b',
    title: '4. Verifikasi Identitas (e-KYC)',
    content: `Proses verifikasi NIK melalui layanan e-KYC PassPorto terintegrasi dengan sistem Direktorat Jenderal Kependudukan dan Pencatatan Sipil (Dukcapil). Anda menyatakan bahwa:

• Data KTP yang dimasukkan adalah data diri Anda sendiri yang valid
• Anda tidak memalsukan atau memanipulasi dokumen identitas
• Anda bersedia mempertanggungjawabkan kebenaran data yang diberikan

Verifikasi NIK yang berhasil merupakan syarat untuk mengajukan permohonan paspor melalui platform ini.`,
  },
  {
    icon: AlertCircle,
    color: '#f43f5e',
    title: '5. Pembatasan Tanggung Jawab',
    content: `PassPorto beroperasi sebagai platform perantara digital antara pemohon paspor dengan Kantor Imigrasi. Keputusan akhir atas permohonan paspor sepenuhnya berada di tangan pejabat Imigrasi yang berwenang.

PassPorto tidak bertanggung jawab atas:
• Keterlambatan atau penolakan permohonan yang disebabkan oleh faktor di luar kontrol kami
• Kesalahan informasi yang diinput oleh pengguna
• Gangguan layanan yang disebabkan oleh force majeure atau pemeliharaan sistem
• Kerugian yang timbul dari penggunaan yang tidak sesuai ketentuan`,
  },
  {
    icon: Shield,
    color: '#097DE9',
    title: '6. Keamanan Akun',
    content: `Anda bertanggung jawab penuh atas keamanan akun dan kata sandi Anda. Harap perhatikan:

• Jangan bagikan kata sandi akun kepada siapa pun
• Gunakan kata sandi yang kuat dan unik untuk akun PassPorto
• Segera hubungi kami jika Anda mencurigai adanya akses tidak sah ke akun Anda
• PassPorto tidak akan pernah meminta kata sandi Anda melalui email atau telepon

PassPorto menerapkan enkripsi AES-256 untuk menjaga keamanan data transmisi Anda.`,
  },
  {
    icon: FileText,
    color: '#64748b',
    title: '7. Perubahan Ketentuan',
    content: `PassPorto berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan yang signifikan akan diberitahukan kepada pengguna melalui notifikasi dalam aplikasi atau email terdaftar.

Penggunaan layanan PassPorto yang berkelanjutan setelah pemberitahuan perubahan dianggap sebagai penerimaan atas ketentuan yang baru.

Syarat dan Ketentuan ini berlaku sejak tanggal 1 Januari 2025 dan diatur berdasarkan hukum Negara Republik Indonesia.`,
  },
];

export default function TermsModal({ onClose }: TermsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: 'var(--border)', background: 'rgba(9,125,233,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(9,125,233,0.12)', border: '1px solid rgba(9,125,233,0.25)' }}>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-base">Syarat & Ketentuan</h2>
              <p className="text-xs text-slate-400 font-medium">PassPorto — Berlaku sejak 1 Januari 2025</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Intro banner */}
          <div className="p-4 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(9,125,233,0.08)', border: '1px solid rgba(9,125,233,0.2)', color: '#93c5fd' }}>
            Harap baca seluruh syarat dan ketentuan berikut sebelum mendaftar dan menggunakan layanan PassPorto. Layanan ini dibuat untuk memudahkan WNI dalam pengurusan paspor secara digital.
          </div>

          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${section.color}18`, border: `1px solid ${section.color}35` }}>
                  <section.icon className="w-3.5 h-3.5" style={{ color: section.color }} />
                </div>
                <h3 className="font-bold text-slate-200 text-sm">{section.title}</h3>
              </div>
              <div className="pl-9 text-xs text-slate-350 leading-relaxed whitespace-pre-line font-medium">
                {section.content}
              </div>
            </div>
          ))}

          {/* Footer note */}
          <div className="p-4 rounded-xl text-xs"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', color: '#6ee7b7' }}>
            <p className="font-bold mb-1 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Persetujuan Otomatis
            </p>
            <p className="font-medium text-slate-400">
              Dengan mengklik "Daftar Sekarang", Anda dianggap telah membaca dan menyetujui seluruh Syarat & Ketentuan dan Kebijakan Privasi PassPorto yang tercantum di atas.
            </p>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-6 py-4 border-t flex justify-end gap-3"
          style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.2)' }}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-slate-100 hover:bg-white/8 transition-all cursor-pointer border border-white/10"
          >
            Tutup
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer border-none btn-glow"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
          >
            Saya Setuju
          </button>
        </div>
      </div>
    </div>
  );
}
