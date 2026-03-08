'use client';

import { useState, useRef } from "react";
import Image from "next/image";
import { Show, SignInButton, UserButton, useUser } from "@clerk/nextjs";

type ResultData = {
  verified: boolean;
  isAI: boolean;
  aiReason: string;
  creator: string;
  distance: number;
  certificateId: string | null;
} | null;

type ImageMeta = {
  title: string;
  description: string;
  location: string;
  dateTaken: string;
};

export default function CertificationPortal() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [result, setResult] = useState<ResultData>(null);
  const [meta, setMeta] = useState<ImageMeta>({ title: '', description: '', location: '', dateTaken: '' });
  const [step, setStep] = useState<'upload' | 'details' | 'result'>('upload');
  const certificateRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStatus('idle');
      setResult(null);
      setStep('details');
    }
  };

  const handleCertify = async () => {
    if (!selectedImage) return;
    setStatus('processing');
    setStep('result');

    const formData = new FormData();
    formData.append('file', selectedImage);
    formData.append('creatorName', user?.fullName || 'Authenticated User');
    formData.append('userId', user?.id || '');
    formData.append('title', meta.title);
    formData.append('description', meta.description);
    formData.append('location', meta.location);
    formData.append('dateTaken', meta.dateTaken);

    try {
      const response = await fetch('/api/verify', { method: 'POST', body: formData });
      const data = await response.json();

      if (data.status) {
        setResult({ verified: data.verified, isAI: data.isAI, aiReason: data.aiReason, creator: data.creator, distance: data.distance, certificateId: data.certificateId || null });
        setStatus('done');
      } else {
        alert('Certification failed: ' + data.error);
        setStatus('idle');
        setStep('details');
      }
    } catch (error) {
      console.error('Frontend Error:', error);
      setStatus('idle');
      setStep('details');
    }
  };

  const handleDownloadCertificate = () => {
    if (!result) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const certDate = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    const certId = result.certificateId || `TM-${Date.now().toString(36).toUpperCase()}`;
    const statusColor = result.isAI ? '#a855f7' : result.verified ? '#22c55e' : '#3b82f6';
    const statusLabel = result.isAI ? 'AI GENERATED' : result.verified ? 'PREVIOUSLY REGISTERED' : 'CERTIFIED AUTHENTIC';

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>TrustMesh Certificate - ${certId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0a0f1e;color:white;font-family:'DM Sans',sans-serif;display:flex;justify-content:center;padding:32px 20px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .cert{width:700px;background:linear-gradient(135deg,#0f1729 0%,#131e35 50%,#0f1729 100%);border:1px solid rgba(99,179,237,0.22);border-radius:16px;padding:44px 48px;position:relative;overflow:hidden}
    .cert::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 15% 15%,rgba(59,130,246,0.07) 0%,transparent 55%),radial-gradient(ellipse at 85% 85%,rgba(99,179,237,0.05) 0%,transparent 55%);pointer-events:none}
    .corner{position:absolute;width:40px;height:40px;border-color:rgba(99,179,237,0.3);border-style:solid}
    .tl{top:14px;left:14px;border-width:2px 0 0 2px;border-radius:3px 0 0 0}
    .tr{top:14px;right:14px;border-width:2px 2px 0 0;border-radius:0 3px 0 0}
    .bl{bottom:14px;left:14px;border-width:0 0 2px 2px;border-radius:0 0 0 3px}
    .br{bottom:14px;right:14px;border-width:0 2px 2px 0;border-radius:0 0 3px 0}
    .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-family:'Playfair Display',serif;font-size:64px;color:rgba(59,130,246,0.03);pointer-events:none;white-space:nowrap;letter-spacing:8px;text-transform:uppercase}
    .logo-text{font-family:'Playfair Display',serif;font-size:22px;color:#60a5fa;letter-spacing:4px;text-transform:uppercase;text-align:center}
    .logo-sub{font-size:9px;letter-spacing:5px;text-transform:uppercase;color:rgba(255,255,255,0.22);margin-top:3px;text-align:center}
    .divider{width:100%;height:1px;background:linear-gradient(90deg,transparent,rgba(99,179,237,0.28),transparent);margin:18px 0}
    .cert-title{font-family:'Playfair Display',serif;font-size:18px;text-align:center;color:rgba(255,255,255,0.88);margin-bottom:4px}
    .cert-id{text-align:center;font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.18);margin-bottom:18px;font-family:monospace}
    .badge{display:flex;align-items:center;justify-content:center;gap:7px;width:fit-content;margin:0 auto 22px;padding:6px 22px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${statusColor};border:1px solid ${statusColor}40;background:${statusColor}12}
    .dot{width:6px;height:6px;border-radius:50%;background:${statusColor};box-shadow:0 0 7px ${statusColor};flex-shrink:0}
    .content{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:18px}
    .img-box{border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);aspect-ratio:4/3;background:#0a0f1e;display:flex;align-items:center;justify-content:center}
    .img-box img{width:100%;height:100%;object-fit:cover}
    .fields{display:flex;flex-direction:column;gap:11px;justify-content:center}
    .field{border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:10px}
    .fl{font-size:8px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.22);margin-bottom:3px}
    .fv{font-size:12px;color:rgba(255,255,255,0.82);font-weight:500}
    .hash-section{margin-bottom:16px;padding:10px 14px;background:rgba(99,179,237,0.04);border:1px solid rgba(99,179,237,0.12);border-radius:8px}
    .hash-value{font-family:monospace;font-size:10px;color:rgba(99,179,237,0.7);word-break:break-all;line-height:1.6;margin-top:4px}
    .footer{text-align:center;font-size:10px;color:rgba(255,255,255,0.13);letter-spacing:1px;line-height:1.8}
    @media print{body{background:#0a0f1e !important}@page{size:A4;margin:12mm}}
  </style>
</head>
<body>
  <div class="cert">
    <div class="corner tl"></div><div class="corner tr"></div>
    <div class="corner bl"></div><div class="corner br"></div>
    <div class="watermark">VERIFIED</div>
    <div class="logo-text">TrustMesh</div>
    <div class="logo-sub">Digital Media Certification Authority</div>
    <div class="divider"></div>
    <div class="cert-title">Certificate of Media Authentication</div>
    <div class="cert-id">ID: ${certId}</div>
    <div class="badge"><div class="dot"></div>${statusLabel}</div>
    <div class="content">
      <div class="img-box"><img src="${previewUrl}" alt="Certified Media" crossorigin="anonymous"/></div>
      <div class="fields">
        <div class="field"><div class="fl">Image Title</div><div class="fv">${meta.title || 'Untitled'}</div></div>
        <div class="field"><div class="fl">Creator</div><div class="fv">${user?.fullName || 'Authenticated User'}</div></div>
        <div class="field"><div class="fl">Location</div><div class="fv">${meta.location || '—'}</div></div>
        <div class="field"><div class="fl">Date Taken</div><div class="fv">${meta.dateTaken || '—'}</div></div>
        <div class="field"><div class="fl">Certified On</div><div class="fv">${certDate}</div></div>
      </div>
    </div>
    ${meta.description ? `<div class="field" style="margin-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:10px"><div class="fl">Description</div><div class="fv">${meta.description}</div></div>` : ''}
    <div class="divider"></div>
    <div class="footer">This certificate was generated by TrustMesh Portal · ${certDate}<br/><span style="font-family:monospace;color:rgba(99,179,237,0.25)">${certId}</span></div>
  </div>
  <script>window.onload=()=>window.print()</script>
</body>
</html>`);
    printWindow.document.close();
  };

  const getStatusConfig = () => {
    if (!result) return null;
    if (result.isAI) return { label: '🤖 AI Generated', sublabel: result.aiReason, border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-300', dot: 'bg-purple-400' };
    if (result.verified) return { label: '✅ Previously Registered', sublabel: `Registered by ${result.creator}`, border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-300', dot: 'bg-green-400' };
    return { label: '📋 Certified & Registered', sublabel: 'New content saved to database', border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-300', dot: 'bg-blue-400' };
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f1729 50%, #0a1628 100%)' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', background: 'rgba(10,15,30,0.8)' }} className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div>
          <span style={{ fontFamily: 'Georgia, serif', letterSpacing: '2px' }} className="text-blue-400 font-bold text-xl">TRUSTMESH</span>
          <span className="text-xs text-gray-500 ml-3 tracking-widest uppercase">Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <Show when="signed-in">
            <span className="text-xs text-gray-400 hidden sm:block">{user?.fullName}</span>
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="text-sm px-5 py-2 rounded-lg font-medium transition-all" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', color: '#93c5fd' }}>
                Sign In
              </button>
            </SignInButton>
          </Show>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.2rem', letterSpacing: '-0.5px' }} className="text-white font-bold mb-2">
            Media Certification Hub
          </h1>
          <p className="text-gray-400 text-sm tracking-wide">Generate a verifiable Digital Birth Certificate for your media</p>

          {/* Step indicators */}
          {step !== 'upload' && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {(['upload', 'details', 'result'] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s ? 'bg-blue-500 text-white' :
                    (['upload','details','result'] as const).indexOf(step) > i ? 'bg-green-500 text-white' :
                    'bg-gray-700 text-gray-400'
                  }`}>{i + 1}</div>
                  {i < 2 && <div className={`w-8 h-px ${(['upload','details','result'] as const).indexOf(step) > i ? 'bg-green-500' : 'bg-gray-700'}`} />}
                </div>
              ))}
              <div className="flex gap-4 ml-2 text-xs text-gray-500">
               <span className={(step as string) === 'upload' ? 'text-blue-400' : ''}>Upload</span>
                <span className={step === 'details' ? 'text-blue-400' : ''}>Details</span>
                <span className={step === 'result' ? 'text-blue-400' : ''}>Result</span>
              </div>
            </div>
          )}
        </div>

        <Show when="signed-in">
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)' }}>

            {/* STEP 1: Upload */}
            {step === 'upload' && (
              <div className="p-8">
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-56 rounded-xl cursor-pointer transition-all group"
                  style={{ border: '2px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="text-white font-medium mb-1">Drop your image here</p>
                  <p className="text-gray-500 text-sm">JPEG or PNG · up to 5MB</p>
                  <input type="file" accept="image/jpeg, image/png" onChange={handleImageChange} className="hidden" id="file-upload" />
                </label>
              </div>
            )}

            {/* STEP 2: Details */}
            {step === 'details' && previewUrl && (
              <div className="p-8 flex flex-col gap-6">
                {/* Image preview */}
                <div className="relative rounded-xl overflow-hidden w-full" style={{ border: '1px solid rgba(255,255,255,0.08)', maxHeight: '220px' }}>
                  <Image src={previewUrl} alt="Preview" width={600} height={400} className="w-full object-contain" style={{ maxHeight: '220px', background: '#0a0f1e' }} unoptimized />
                  <label htmlFor="file-upload-2" className="absolute top-3 right-3 cursor-pointer text-xs px-3 py-1.5 rounded-full transition-all" style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}>
                    ↺ Change
                  </label>
                  <input type="file" accept="image/jpeg, image/png" onChange={handleImageChange} className="hidden" id="file-upload-2" />
                </div>

                {/* Meta form */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 tracking-wider uppercase">Image Details</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 tracking-widest uppercase block mb-1.5">Image Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Sunset over Mumbai 2024"
                        value={meta.title}
                        onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 tracking-widest uppercase block mb-1.5">Description</label>
                      <textarea
                        placeholder="Brief description of this image..."
                        value={meta.description}
                        onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all resize-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 tracking-widest uppercase block mb-1.5">Location</label>
                        <input
                          type="text"
                          placeholder="e.g. Jaipur, India"
                          value={meta.location}
                          onChange={e => setMeta(m => ({ ...m, location: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-600 outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                          onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
                          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 tracking-widest uppercase block mb-1.5">Date Taken</label>
                        <input
                          type="date"
                          value={meta.dateTaken}
                          onChange={e => setMeta(m => ({ ...m, dateTaken: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg text-sm text-white outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                          onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
                          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                      </div>
                    </div>

                    {/* Creator info (read-only) */}
                    <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', padding: '12px 16px' }} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                        {user?.fullName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Creator</p>
                        <p className="text-sm text-white font-medium">{user?.fullName || 'Authenticated User'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCertify}
                  className="w-full py-3.5 rounded-xl font-semibold text-white transition-all text-sm tracking-wide"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 24px rgba(59,130,246,0.3)' }}
                >
                  🔏 Sign & Certify Content
                </button>
              </div>
            )}

            {/* STEP 3: Result */}
            {step === 'result' && (
              <div className="p-8 flex flex-col gap-5" ref={certificateRef}>
                {status === 'processing' ? (
                  <div className="flex flex-col items-center py-12 gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-gray-400 text-sm">Analyzing & certifying your media...</p>
                  </div>
                ) : result && statusConfig && (
                  <>
                    {/* Result badge */}
                    <div className={`rounded-xl p-5 ${statusConfig.bg}`} style={{ border: `1px solid`, borderColor: statusConfig.border.replace('border-', '') }}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot}`} />
                        <div>
                          <p className={`font-bold ${statusConfig.text}`}>{statusConfig.label}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{statusConfig.sublabel}</p>
                        </div>
                      </div>
                    </div>

                    {/* Image + details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Image src={previewUrl!} alt="Certified" width={300} height={200} className="w-full object-cover h-40" unoptimized />
                      </div>
                      <div className="flex flex-col gap-2 justify-center">
                        {[
                          { label: 'Title', value: meta.title || 'Untitled' },
                          { label: 'Creator', value: user?.fullName || 'Authenticated User' },
                          { label: 'Location', value: meta.location || '—' },
                          { label: 'Date', value: meta.dateTaken || '—' },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-xs text-gray-600 uppercase tracking-widest">{label}</p>
                            <p className="text-sm text-gray-200 font-medium truncate">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {meta.description && (
                      <div className="px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Description</p>
                        <p className="text-sm text-gray-300">{meta.description}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button
                        onClick={handleDownloadCertificate}
                        className="py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 20px rgba(59,130,246,0.25)' }}
                      >
                        ⬇ Download Certificate
                      </button>
                      {result?.certificateId && (
                        <a
                          href={`/certificate/${result.certificateId}`}
                          target="_blank"
                          className="py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 col-span-2"
                          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', textDecoration: 'none' }}
                        >
                          🔗 View Public Certificate
                        </a>
                      )}
                      <button
                        onClick={() => { setStep('upload'); setPreviewUrl(null); setSelectedImage(null); setResult(null); setMeta({ title: '', description: '', location: '', dateTaken: '' }); }}
                        className="py-3 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                      >
                        + Certify Another
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </Show>

        <Show when="signed-out">
          <div className="rounded-2xl p-14 text-center" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <span className="text-2xl">🔒</span>
            </div>
            <p className="text-gray-300 text-lg mb-2 font-medium">Sign in to certify media</p>
            <p className="text-gray-600 text-sm mb-8">You need a verified account to register and certify media content.</p>
            <SignInButton mode="modal">
              <button className="px-8 py-3 rounded-xl font-semibold text-white text-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}>
                Sign In Now
              </button>
            </SignInButton>
          </div>
        </Show>
        {/* Extension Download Section */}
<div className="w-full mt-12 mb-8 p-8 rounded-2xl" style={{ border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.05)' }}>
  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
    <div>
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
        <span className="text-blue-400">🧩</span> Get the TrustMesh Sentinel
      </h2>
      <p className="text-sm text-gray-400 max-w-md">
        Download our beta Chrome Extension to automatically verify images across the web. Install manually via Developer Mode.
      </p>
    </div>
    
    <div className="flex flex-col items-center">
      {/* The actual download link pointing to your public folder */}
      <a 
        href="/trustmesh-extension.zip" 
        download="trustmesh-extension.zip"
        className="px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all flex items-center gap-2 mb-3"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 20px rgba(59,130,246,0.3)', textDecoration: 'none' }}
      >
        📥 Download Extension (.zip)
      </a>
      
      {/* Quick instructions toggle or link */}
      <a href="chrome://extensions/" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline">
        How to install?
      </a>
    </div>
  </div>

  {/* Quick Installation Steps */}
  <div className="mt-6 pt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-400" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
    <div><strong className="text-gray-300">1. Extract</strong><br/>Unzip the downloaded folder on your computer.</div>
    <div><strong className="text-gray-300">2. Developer Mode</strong><br/>Go to chrome://extensions and enable Developer Mode.</div>
    <div><strong className="text-gray-300">3. Load Unpacked</strong><br/>Click "Load unpacked" and select your unzipped folder.</div>
  </div>
</div>

      </main>
    </div>
  );
}

