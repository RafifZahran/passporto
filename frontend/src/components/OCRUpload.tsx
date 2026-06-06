'use client';

import { useState, useRef } from 'react';
import { Upload, ScanLine, CheckCircle, AlertCircle, Loader2, X, Image as ImageIcon } from 'lucide-react';
import type { OCRExtractedData } from '@/lib/types';

interface OCRUploadProps {
  onExtracted: (data: OCRExtractedData) => void;
}

// Regex-based text extractor for Indonesian KTP format
function parseKTPText(text: string): OCRExtractedData {
  const cleanText = text.toUpperCase();
  const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let nik = '';
  let name = '';
  let birthDate = '';
  let gender = '';
  let addressLines: string[] = [];
  let rtRw = '';
  let kelDesa = '';
  let kecamatan = '';

  // Helper to validate Indonesian NIK structure
  const isValidIndonesiaNIK = (val: string): boolean => {
    if (val.length !== 16) return false;
    
    // 1. Check province code (BPS code starts from 11 up to 95)
    const prov = parseInt(val.substring(0, 2), 10);
    if (prov < 11 || prov > 95) return false;

    // 2. Check birth date part
    let day = parseInt(val.substring(6, 8), 10);
    if (day > 40) day -= 40; // Female offset
    if (day < 1 || day > 31) return false;

    // 3. Check birth month part
    const month = parseInt(val.substring(8, 10), 10);
    if (month < 1 || month > 12) return false;

    return true;
  };

  const getValidNIK = (candidate: string): string | null => {
    const cleaned = candidate
      .replace(/[O]/g, '0')
      .replace(/[IL]/g, '1')
      .replace(/[^0-9]/g, '');
    if (isValidIndonesiaNIK(cleaned)) {
      return cleaned;
    }
    return null;
  };

  // 1. Extract NIK
  // Strategy 1: Look for any sequence of 15-25 characters containing digits/confusables line-by-line first
  for (let line of lines) {
    const matches = line.match(/[0-9OIL]{15,25}/g);
    if (matches) {
      for (let m of matches) {
        for (let i = 0; i <= m.length - 16; i++) {
          const windowStr = m.substring(i, i + 16);
          const valid = getValidNIK(windowStr);
          if (valid) {
            nik = valid;
            break;
          }
        }
        if (nik) break;
      }
    }
    if (nik) break;
  }

  // Strategy 2: If line-by-line fails, scan the whole text (without line breaks) for any 16-digit sequence that is a valid NIK
  if (!nik) {
    const wholeTextCleaned = cleanText
      .replace(/[O]/g, '0')
      .replace(/[IL|\[\]]/g, '1')
      .replace(/[^0-9]/g, '');
    
    for (let i = 0; i <= wholeTextCleaned.length - 16; i++) {
      const windowStr = wholeTextCleaned.substring(i, i + 16);
      const valid = getValidNIK(windowStr);
      if (valid) {
        nik = valid;
        break;
      }
    }
  }

  // Define KTP label detection helper
  const isLabel = (line: string): boolean => {
    const keywords = ['NAMA', 'LAHIR', 'TGL', 'TEMP', 'KELAMIN', 'JENIS', 'ALAMAT', 'RT/RW', 'KEL/DESA', 'KECAMATAN', 'AGAMA', 'STATUS', 'PEKERJAAN', 'KEWARGANEGARAAN', 'BERLAKU'];
    if (line.includes(':') && line.split(':')[1].trim().length > 1) {
      return false;
    }
    return keywords.some(k => line.includes(k));
  };

  // Check if layout is column-based: check only first 12 lines to avoid merged line-based details at the bottom (like Agama, Pekerjaan) affecting the upper details layout detection
  let mergedCount = 0;
  let pureLabelCount = 0;
  const detectionLines = lines.slice(0, 12);
  for (let line of detectionLines) {
    const hasKeyword = ['NAMA', 'LAHIR', 'TGL', 'TEMP', 'KELAMIN', 'JENIS', 'ALAMAT', 'RT/RW', 'KEL/DESA', 'KECAMATAN', 'AGAMA', 'STATUS', 'PEKERJAAN', 'KEWARGANEGARAAN', 'BERLAKU'].some(k => line.includes(k));
    if (hasKeyword) {
      if (line.includes(':') && line.split(':')[1].trim().length > 1) {
        mergedCount++;
      } else {
        pureLabelCount++;
      }
    }
  }
  const isColumnLayout = pureLabelCount >= 3 && mergedCount === 0;

  if (isColumnLayout) {
    const labels: string[] = [];
    const values: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(':')) {
        const val = line.substring(line.indexOf(':') + 1).trim();
        // Skip NIK value from our labels/values pairing
        const cleanedVal = val.replace(/[^0-9]/g, '');
        if (nik && cleanedVal === nik) {
          continue;
        }

        // Gather continuation lines
        let fullVal = val;
        while (i + 1 < lines.length && !lines[i + 1].includes(':') && !isLabel(lines[i + 1])) {
          fullVal += ' ' + lines[i + 1];
          i++;
        }
        values.push(fullVal);
      } else if (isLabel(line)) {
        labels.push(line);
      }
    }

    // Map labels to values in sequence
    for (let idx = 0; idx < labels.length; idx++) {
      const label = labels[idx];
      const val = values[idx] || '';
      if (!val) continue;

      if (label.includes('NAMA')) {
        name = val.replace(/[^A-Z\s]/g, '').trim();
      } else if (label.includes('LAHIR') || label.includes('TGL')) {
        const cleanedVal = val.replace(/[O]/g, '0').replace(/[IL|]/g, '1');
        const dateMatch = cleanedVal.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
        if (dateMatch) {
          birthDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
        }
      } else if (label.includes('KELAMIN') || label.includes('JENIS')) {
        gender = val.includes('LAKI') ? 'Laki-Laki' : (val.includes('PEREMPUAN') ? 'Perempuan' : '');
      } else if (label.includes('ALAMAT')) {
        addressLines.push(val);
      } else if (label.includes('RT/RW') || label.includes('RT /')) {
        rtRw = val;
      } else if (label.includes('KEL') || label.includes('DESA')) {
        kelDesa = val;
      } else if (label.includes('KEC')) {
        kecamatan = val;
      }
    }
  } else {
    // Standard line-by-line or split-line parsing
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Name
      if (line.includes('NAMA')) {
        const parts = line.split(/[:|!]/);
        if (parts.length > 1 && parts[1].trim().length > 2) {
          name = parts[1].replace(/[^A-Z\s]/g, '').trim();
        } else if (i + 1 < lines.length && !isLabel(lines[i + 1])) {
          const nextVal = lines[i + 1].replace(/^[:\s!|]+/, '').trim();
          name = nextVal.replace(/[^A-Z\s]/g, '').trim();
        }
      }

      // Birth Date
      if ((line.includes('LAHIR') || line.includes('TGL') || line.includes('TEMP')) && !birthDate) {
        const cleanedLine = line.replace(/[O]/g, '0').replace(/[IL|]/g, '1');
        const dateMatch = cleanedLine.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
        if (dateMatch) {
          birthDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
        } else {
          const dateMatchShort = cleanedLine.match(/(\d{2})[-/](\d{2})[-/](\d{2})/);
          if (dateMatchShort) {
            const year = parseInt(dateMatchShort[3]) > 50 ? `19${dateMatchShort[3]}` : `20${dateMatchShort[3]}`;
            birthDate = `${year}-${dateMatchShort[2]}-${dateMatchShort[1]}`;
          }
        }
      }

      // Gender
      if (line.includes('KELAMIN') || line.includes('JENIS') || line.includes('LAKI') || line.includes('PEREMPUAN')) {
        if (line.includes('LAKI') || line.includes('LAK')) {
          gender = 'Laki-Laki';
        } else if (line.includes('PEREMPUAN') || line.includes('PEREM')) {
          gender = 'Perempuan';
        }
      }

      // Address
      if (line.includes('ALAMAT')) {
        const parts = line.split(/[:|!]/);
        let val = parts.length > 1 ? parts[1].trim() : '';
        if (!val && i + 1 < lines.length && !isLabel(lines[i + 1])) {
          val = lines[i + 1].replace(/^[:\s!|]+/, '').trim();
          i++;
        }
        if (val) {
          // Gather any continuation lines that are not labels
          while (i + 1 < lines.length && !lines[i + 1].includes(':') && !isLabel(lines[i + 1])) {
            val += ' ' + lines[i + 1];
            i++;
          }
          addressLines.push(val);
        }
      } else if (line.includes('RT/RW') || line.includes('RT /') || line.includes('RW /')) {
        const parts = line.split(/[:|!]/);
        const val = parts.length > 1 ? parts[1].trim() : (i + 1 < lines.length && !isLabel(lines[i + 1]) ? lines[i + 1] : '');
        if (val) rtRw = val.replace(/^[:\s!|]+/, '').trim();
      } else if ((line.includes('KEL') && !line.includes('KELAMIN')) || line.includes('DESA')) {
        const parts = line.split(/[:|!]/);
        const val = parts.length > 1 ? parts[1].trim() : (i + 1 < lines.length && !isLabel(lines[i + 1]) ? lines[i + 1] : '');
        if (val) kelDesa = val.replace(/^[:\s!|]+/, '').trim();
      } else if (line.includes('KECAMATAN') || line.includes('KEC ')) {
        const parts = line.split(/[:|!]/);
        const val = parts.length > 1 ? parts[1].trim() : (i + 1 < lines.length && !isLabel(lines[i + 1]) ? lines[i + 1] : '');
        if (val) kecamatan = val.replace(/^[:\s!|]+/, '').trim();
      }
    }
  }

  // Format final address
  const addrParts: string[] = [];
  if (addressLines.length > 0) addrParts.push(addressLines.join(' ').replace(/^[:\s!|]+/, '').trim());
  if (rtRw) addrParts.push('RT/RW ' + rtRw);
  if (kelDesa) addrParts.push(kelDesa);
  if (kecamatan) addrParts.push(kecamatan);

  let address = addrParts.join(', ').replace(/, ,/g, ',').trim();
  
  if (name.startsWith('NAMA')) {
    name = name.replace(/^NAMA[:\s]+/i, '').trim();
  }

  // Fallbacks if line parsing missed some fields
  if (!birthDate) {
    const cleanedText = cleanText.replace(/[O]/g, '0').replace(/[IL|]/g, '1');
    const dateMatch = cleanedText.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
    if (dateMatch) {
      const [_, day, month, year] = dateMatch;
      birthDate = `${year}-${month}-${day}`;
    }
  }

  // Fallback birth date from NIK if still empty
  if (!birthDate && nik && nik.length === 16) {
    let day = parseInt(nik.substring(6, 8), 10);
    if (day > 40) day -= 40; // Female offset
    const month = nik.substring(8, 10);
    const yearShort = nik.substring(10, 12);
    const currentYear = new Date().getFullYear();
    const currentYearShort = currentYear % 100;
    const year = parseInt(yearShort, 10) > currentYearShort ? `19${yearShort}` : `20${yearShort}`;
    const dayStr = day.toString().padStart(2, '0');
    birthDate = `${year}-${month}-${dayStr}`;
  }

  if (!gender) {
    if (cleanText.includes('LAKI')) gender = 'Laki-Laki';
    else if (cleanText.includes('PEREMPUAN')) gender = 'Perempuan';
  }

  // Fallback gender from NIK if still empty
  if (!gender && nik && nik.length === 16) {
    const day = parseInt(nik.substring(6, 8), 10);
    gender = day > 40 ? 'Perempuan' : 'Laki-Laki';
  }

  return {
    nik: nik || '',
    full_name: name || '',
    birth_date: birthDate || '',
    gender: gender || '',
    address: address || '',
  };
}

export default function OCRUpload({ onExtracted }: OCRUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [extracted, setExtracted] = useState<OCRExtractedData | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setStatus('error');
      setErrorMsg('Format file tidak didukung. Harap upload gambar (JPG, PNG).');
      return;
    }
    setFile(f);
    setStatus('idle');
    setErrorMsg('');
    setExtracted(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleScan = async () => {
    if (!file) return;

    // File size validation (max 1024 KB / 1 MB for OCR.space free api)
    if (file.size > 1024 * 1024) {
      setStatus('error');
      setErrorMsg('Ukuran file terlalu besar (Maksimal 1 MB untuk versi API gratis). Silakan kompres gambar atau gunakan file KTP lain yang lebih kecil.');
      return;
    }

    setStatus('scanning');
    setErrorMsg('');

    try {
      // Create FormData to send to OCR.space API
      const formData = new FormData();
      formData.append('file', file);
      
      // Free testing key is 'helloworld' or user can register a free key instantly
      const apiKey = process.env.NEXT_PUBLIC_OCR_SPACE_KEY || 'helloworld';
      formData.append('apikey', apiKey);
      formData.append('language', 'eng'); // Use 'eng' since KTP uses Latin characters
      formData.append('isOverlayRequired', 'false');
      formData.append('OCREngine', '2'); // Use Engine 2 for multi-column layout detection

      const res = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.IsErroredOnProcessing || !result.ParsedResults || result.ParsedResults.length === 0) {
        const errorMsg = result.ErrorMessage?.[0] || 'Gagal memproses gambar dari API.';
        throw new Error(errorMsg);
      }

      const parsedText = result.ParsedResults?.[0]?.ParsedText || '';
      console.log('[OCR.space Raw Text]', parsedText);

      const data = parseKTPText(parsedText);
      setExtracted(data);
      setStatus('done');
      onExtracted(data);
    } catch (err: any) {
      console.error('[OCR Error]', err);
      setStatus('error');
      
      let friendlyError = err.message || 'Terjadi kesalahan saat memproses OCR. Silakan coba lagi.';
      if (friendlyError.includes('E553') || friendlyError.toLowerCase().includes('rate limit')) {
        friendlyError = 'Batas penggunaan API gratis (OCR.space) telah habis untuk jam ini. Harap tunggu beberapa saat, atau daftarkan API Key gratis Anda sendiri dan masukkan ke dalam file .env.local sebagai NEXT_PUBLIC_OCR_SPACE_KEY.';
      }
      setErrorMsg(friendlyError);
    }
  };

  const reset = () => {
    setFile(null); setPreview(null);
    setStatus('idle'); setExtracted(null); setErrorMsg('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <ScanLine className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-bold text-[#292966]">Upload KTP untuk Auto-Fill</span>
        <span className="px-2 py-0.5 text-xs rounded-full font-medium" style={{ background: 'rgba(59,130,246,0.15)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.3)' }}>
          OCR
        </span>
      </div>
      <p className="text-xs text-[#777777] font-medium">Upload foto KTP Anda dan data akan terisi otomatis menggunakan teknologi OCR.</p>

      {/* Drop zone */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
            ${dragOver
              ? 'border-blue-400 bg-blue-50/5'
              : 'border-[rgba(74,74,74,0.15)] hover:border-blue-400/50 hover:bg-[rgba(59,130,246,0.02)]'}`}>
          <input
            id="ocr-file-input"
            ref={inputRef} type="file"
            accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <Upload className="w-7 h-7 text-blue-400" />
          </div>
          <p className="font-semibold text-sm mb-1 text-[#4A4A4A]">Seret & lepas foto KTP di sini</p>
          <p className="text-[#777777] text-xs font-semibold">atau klik untuk pilih file · JPG, PNG, HEIC</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-[rgba(74,74,74,0.12)]">
          {/* Preview */}
          <div className="relative bg-slate-900">
            {preview && (
              <img src={preview} alt="KTP preview" className="w-full max-h-48 object-contain" />
            )}
            <button onClick={reset} id="ocr-reset-btn"
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors"
              style={{ background: 'rgba(0,0,0,0.6)' }}>
              <X className="w-4 h-4" />
            </button>
            {status === 'scanning' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.7)' }}>
                <div className="relative">
                  <ScanLine className="w-10 h-10 text-blue-400 animate-bounce" />
                  {/* Scan line animation */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 animate-pulse" />
                </div>
                <p className="text-sm text-blue-300 mt-3 font-medium">Memindai KTP...</p>
                <p className="text-xs text-slate-400 mt-1">Mengekstrak data identitas</p>
              </div>
            )}
          </div>

          {/* File info & actions */}
          <div className="p-4 flex items-center gap-3">
            <ImageIcon className="w-4 h-4 text-[#777777] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#4A4A4A] truncate">{file.name}</p>
              <p className="text-xs text-[#777777] font-semibold">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            {status !== 'done' && (
              <button id="ocr-scan-btn" onClick={handleScan} disabled={status === 'scanning'}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 btn-glow"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
                {status === 'scanning'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <ScanLine className="w-4 h-4" />}
                {status === 'scanning' ? 'Memindai...' : 'Scan Sekarang'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {status === 'done' && extracted && (
        <div className="rounded-2xl p-5 animate-fade-in space-y-3"
          style={{ background: 'rgba(81,151,85,0.08)', border: '1px solid rgba(81,151,85,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-[#519755]" />
            <span className="text-sm font-bold text-[#519755]">Data berhasil diekstrak dari KTP!</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'NIK', value: extracted.nik },
              { label: 'Nama Lengkap', value: extracted.full_name },
              { label: 'Tanggal Lahir', value: extracted.birth_date },
              { label: 'Jenis Kelamin', value: extracted.gender },
            ].map((f) => f.value && (
              <div key={f.label}>
                <p className="text-xs text-[#777777] mb-0.5 font-bold uppercase tracking-wide">{f.label}</p>
                <p className="font-bold text-[#4A4A4A] truncate">{f.value}</p>
              </div>
            ))}
            {extracted.address && (
              <div className="col-span-2">
                <p className="text-xs text-[#777777] mb-0.5 font-bold uppercase tracking-wide">Alamat</p>
                <p className="font-bold text-[#4A4A4A] leading-relaxed">{extracted.address}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-[#777777] pt-1 font-medium">Data telah diisi otomatis ke formulir di bawah. Anda dapat mengubahnya sebelum submit.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-3 p-4 rounded-xl text-sm"
          style={{ background: 'rgba(227,83,54,0.08)', border: '1px solid rgba(227,83,54,0.2)', color: '#E35336' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg || 'Gagal membaca KTP. Pastikan foto jelas dan tidak buram, lalu coba lagi.'}
        </div>
      )}
    </div>
  );
}
