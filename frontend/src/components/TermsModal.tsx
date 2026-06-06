'use client';

import { X, Shield, FileText, AlertCircle, CheckCircle, Globe } from 'lucide-react';

interface TermsModalProps {
  onClose: () => void;
}

const sections = [
  {
    icon: FileText,
    color: '#292966',
    title: '1. Penerimaan Syarat',
    content: `Dengan mendaftar dan menggunakan layanan PassPorto, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku. Jika Anda tidak setuju dengan ketentuan ini, harap tidak menggunakan layanan kami.\n\nPassPorto adalah platform digital untuk membantu Warga Negara Indonesia (WNI) dalam proses pengajuan paspor. Layanan ini bersifat gratis dan tersedia untuk seluruh WNI yang memenuhi syarat.`,
  },
  {
    icon: Shield,
    color: '#519755',
    title: '2. Perlindungan Data Pribadi',
    content: `PassPorto berkomitmen menjaga kerahasiaan data pribadi Anda sesuai dengan Undang-Undang Pelindungan Data Pribadi (UU PDP) Indonesia.\n\nData yang kami kumpulkan:\n• Nama lengkap, alamat email, dan Nomor Induk Kependudukan (NIK)\n• Data permohonan paspor (foto KTP, informasi diri)\n• Data lokasi GPS (hanya saat proses check-in di Kantor Imigrasi)\n\nData Anda TIDAK akan dijual, disewakan, atau dibagikan kepada pihak ketiga tanpa persetujuan eksplisit Anda, kecuali diwajibkan oleh hukum yang berlaku.`,
  },
  {
    icon: Globe,
    color: '#6D8196',
    title: '3. Penggunaan Layanan',
    content: `Anda setuju untuk menggunakan PassPorto hanya untuk tujuan yang sah dan sesuai hukum yang berlaku di Indonesia. Pengguna dilarang:\n\n• Menyediakan informasi palsu, menyesatkan, atau tidak akurat\n• Menggunakan layanan untuk tujuan penipuan atau manipulasi\n• Mencoba mengakses sistem atau data pengguna lain tanpa izin\n• Melakukan tindakan yang dapat mengganggu atau merusak layanan\n• Menggunakan layanan atas nama orang lain tanpa kuasa yang sah\n\nPelanggaran terhadap ketentuan ini dapat mengakibatkan penangguhan atau penghentian akun Anda.`,
  },
  {
    icon: CheckCircle,
    color: '#54663A',
    title: '4. Verifikasi Identitas (e-KYC)',
    content: `Proses verifikasi NIK melalui layanan e-KYC PassPorto terintegrasi dengan sistem Direktorat Jenderal Kependudukan dan Pencatatan Sipil (Dukcapil). Anda menyatakan bahwa:\n\n• Data KTP yang dimasukkan adalah data diri Anda sendiri yang valid\n• Anda tidak memalsukan atau memanipulasi dokumen identitas\n• Anda bersedia mempertanggungjawabkan kebenaran data yang diberikan\n\nVerifikasi NIK yang berhasil merupakan syarat untuk mengajukan permohonan paspor melalui platform ini.`,
  },
  {
    icon: AlertCircle,
    color: '#E35336',
    title: '5. Pembatasan Tanggung Jawab',
    content: `PassPorto beroperasi sebagai platform perantara digital antara pemohon paspor dengan Kantor Imigrasi. Keputusan akhir atas permohonan paspor sepenuhnya berada di tangan pejabat Imigrasi yang berwenang.\n\nPassPorto tidak bertanggung jawab atas:\n• Keterlambatan atau penolakan permohonan yang disebabkan oleh faktor di luar kontrol kami\n• Kesalahan informasi yang diinput oleh pengguna\n• Gangguan layanan yang disebabkan oleh force majeure atau pemeliharaan sistem\n• Kerugian yang timbul dari penggunaan yang tidak sesuai ketentuan`,
  },
  {
    icon: Shield,
    color: '#292966',
    title: '6. Keamanan Akun',
    content: `Anda bertanggung jawab penuh atas keamanan akun dan kata sandi Anda. Harap perhatikan:\n\n• Jangan bagikan kata sandi akun kepada siapa pun\n• Gunakan kata sandi yang kuat dan unik untuk akun PassPorto\n• Segera hubungi kami jika Anda mencurigai adanya akses tidak sah ke akun Anda\n• PassPorto tidak akan pernah meminta kata sandi Anda melalui email atau telepon\n\nPassPorto menerapkan enkripsi AES-256 untuk menjaga keamanan data transmisi Anda.`,
  },
  {
    icon: FileText,
    color: '#6D8196',
    title: '7. Perubahan Ketentuan',
    content: `PassPorto berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan yang signifikan akan diberitahukan kepada pengguna melalui notifikasi dalam aplikasi atau email terdaftar.\n\nPenggunaan layanan PassPorto yang berkelanjutan setelah pemberitahuan perubahan dianggap sebagai penerimaan atas ketentuan yang baru.\n\nSyarat dan Ketentuan ini berlaku sejak tanggal 1 Januari 2025 dan diatur berdasarkan hukum Negara Republik Indonesia.`,
  },
];

export default function TermsModal({ onClose }: TermsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(74,74,74,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ background: '#ffffff', border: '1px solid rgba(74,74,74,0.12)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(74,74,74,0.1)', background: '#ffffff' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(41,41,102,0.08)', border: '1px solid rgba(41,41,102,0.15)' }}>
              <FileText className="w-4 h-4" style={{ color: '#292966' }} />
            </div>
            <div>
              <h2 className="font-semibold text-base" style={{ color: '#4A4A4A', fontFamily: 'DM Serif Display, Georgia, serif' }}>
                Syarat &amp; Ketentuan
              </h2>
              <p className="text-xs font-semibold" style={{ color: '#777777' }}>
                PassPorto — Berlaku sejak 1 Januari 2025
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors cursor-pointer"
            style={{ color: '#777777', background: 'none', border: 'none' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,74,74,0.06)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Intro banner */}
          <div className="p-4 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(41,41,102,0.05)', border: '1px solid rgba(41,41,102,0.15)', color: '#4A4A4A' }}>
            Harap baca seluruh syarat dan ketentuan berikut sebelum mendaftar dan menggunakan layanan PassPorto. Layanan ini dibuat untuk memudahkan WNI dalam pengurusan paspor secara digital.
          </div>

          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${section.color}14`, border: `1px solid ${section.color}30` }}>
                  <section.icon className="w-3.5 h-3.5" style={{ color: section.color }} />
                </div>
                <h3 className="font-semibold text-sm" style={{ color: '#4A4A4A', fontFamily: 'DM Serif Display, Georgia, serif' }}>
                  {section.title}
                </h3>
              </div>
              <div className="pl-9 text-sm leading-relaxed whitespace-pre-line" style={{ color: '#777777' }}>
                {section.content}
              </div>
            </div>
          ))}

          {/* Footer note */}
          <div className="p-4 rounded-xl text-sm"
            style={{ background: 'rgba(81,151,85,0.06)', border: '1px solid rgba(81,151,85,0.2)', color: '#4A4A4A' }}>
            <p className="font-semibold mb-1 flex items-center gap-1.5" style={{ color: '#519755' }}>
              <CheckCircle className="w-3.5 h-3.5" /> Persetujuan Otomatis
            </p>
            <p style={{ color: '#777777' }}>
              Dengan mengklik "Daftar Sekarang", Anda dianggap telah membaca dan menyetujui seluruh Syarat &amp; Ketentuan dan Kebijakan Privasi PassPorto yang tercantum di atas.
            </p>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-6 py-4 flex justify-end gap-3"
          style={{ borderTop: '1px solid rgba(74,74,74,0.1)', background: '#ffffff' }}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
            style={{ color: '#777777', background: 'transparent', border: '1px solid rgba(74,74,74,0.2)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,74,74,0.06)';
              (e.currentTarget as HTMLButtonElement).style.color = '#4A4A4A';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = '#777777';
            }}
          >
            Tutup
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            style={{ background: '#4A4A4A', color: '#ffffff', border: 'none' }}
          >
            Saya Setuju
          </button>
        </div>
      </div>
    </div>
  );
}
