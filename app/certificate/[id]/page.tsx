import { prisma } from "@/lib/prisma";
import PrintButton from "./PrintButton";

export default async function CertificatePage({ params }: any) {
  const certificate = await prisma.certificate.findFirst({
    where: { certificateId: params.id }
  });

  if (!certificate) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#0a0f1e', color:'white', fontFamily:'Georgia, serif' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🔍</div>
          <h1 style={{ fontSize:24, color:'#f87171', marginBottom:8 }}>Certificate Not Found</h1>
          <p style={{ color:'#64748b', fontFamily:'sans-serif' }}>ID: <code style={{ color:'#94a3b8' }}>{params.id}</code></p>
        </div>
      </div>
    );
  }

  const issuedDate = new Date(certificate.createdAt).toLocaleDateString('en-US', {
    year:'numeric', month:'long', day:'numeric'
  });

  const fields = [
    { label: 'Image Title', value: (certificate as any).title || certificate.fileName },
    { label: 'Creator', value: (certificate as any).creatorName || '—' },
    { label: 'Description', value: (certificate as any).description || '—' },
    { label: 'Location', value: (certificate as any).location || '—' },
    { label: 'Date Taken', value: (certificate as any).dateTaken || '—' },
    { label: 'Certificate ID', value: certificate.certificateId },
    { label: 'Certified On', value: issuedDate },
    { label: 'Registry', value: 'TrustMesh Decentralized DB' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#0a0f1e; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        .cert-page {
          min-height:100vh;
          background:linear-gradient(135deg,#0a0f1e 0%,#0f1729 50%,#0a1628 100%);
          display:flex; flex-direction:column; align-items:center;
          padding:28px 20px;
          font-family:'DM Sans',sans-serif; color:white;
        }
        .nav { width:100%; max-width:680px; display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
        .nav-logo { font-family:'Playfair Display',serif; font-size:18px; color:#60a5fa; letter-spacing:3px; text-transform:uppercase; }
        .cert {
          width:100%; max-width:680px;
          background:linear-gradient(135deg,#0f1729 0%,#131e35 50%,#0f1729 100%);
          border:1px solid rgba(99,179,237,0.22);
          border-radius:16px; padding:44px 48px;
          position:relative; overflow:hidden;
        }
        .cert::before {
          content:''; position:absolute; inset:0;
          background:radial-gradient(ellipse at 15% 15%,rgba(59,130,246,0.07) 0%,transparent 55%),
                     radial-gradient(ellipse at 85% 85%,rgba(99,179,237,0.05) 0%,transparent 55%);
          pointer-events:none;
        }
        .corner { position:absolute; width:40px; height:40px; border-color:rgba(99,179,237,0.3); border-style:solid; }
        .tl{top:14px;left:14px;border-width:2px 0 0 2px;border-radius:3px 0 0 0}
        .tr{top:14px;right:14px;border-width:2px 2px 0 0;border-radius:0 3px 0 0}
        .bl{bottom:14px;left:14px;border-width:0 0 2px 2px;border-radius:0 0 0 3px}
        .br{bottom:14px;right:14px;border-width:0 2px 2px 0;border-radius:0 0 3px 0}
        .watermark {
          position:absolute; top:50%; left:50%;
          transform:translate(-50%,-50%) rotate(-30deg);
          font-family:'Playfair Display',serif; font-size:64px;
          color:rgba(59,130,246,0.03); pointer-events:none;
          white-space:nowrap; letter-spacing:8px; text-transform:uppercase;
        }
        .header { text-align:center; margin-bottom:20px; position:relative; }
        .logo-text { font-family:'Playfair Display',serif; font-size:22px; color:#60a5fa; letter-spacing:4px; text-transform:uppercase; }
        .logo-sub { font-size:9px; letter-spacing:5px; text-transform:uppercase; color:rgba(255,255,255,0.22); margin-top:3px; }
        .divider { width:100%; height:1px; background:linear-gradient(90deg,transparent,rgba(99,179,237,0.28),transparent); margin:18px 0; }
        .cert-title { font-family:'Playfair Display',serif; font-size:18px; text-align:center; color:rgba(255,255,255,0.88); margin-bottom:4px; }
        .cert-id { text-align:center; font-size:10px; letter-spacing:3px; color:rgba(255,255,255,0.18); margin-bottom:18px; font-family:monospace; }
        .status-badge {
          display:flex; align-items:center; justify-content:center; gap:7px;
          width:fit-content; margin:0 auto 22px;
          padding:6px 22px; border-radius:999px;
          border:1px solid rgba(34,197,94,0.45); background:rgba(34,197,94,0.07);
          color:#86efac; font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase;
        }
        .dot { width:6px; height:6px; border-radius:50%; background:#22c55e; box-shadow:0 0 7px #22c55e; flex-shrink:0; }
        .fields { display:grid; grid-template-columns:1fr 1fr; gap:0; margin-bottom:18px; }
        .field { border-bottom:1px solid rgba(255,255,255,0.06); padding:12px 0; }
        .field:nth-child(odd) { padding-right:24px; }
        .field:nth-child(even) { padding-left:24px; border-left:1px solid rgba(255,255,255,0.06); }
        .field-label { font-size:8px; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.22); margin-bottom:4px; }
        .field-value { font-size:13px; color:rgba(255,255,255,0.82); font-weight:500; }
        .hash-section { margin-bottom:18px; padding:12px 16px; background:rgba(99,179,237,0.04); border:1px solid rgba(99,179,237,0.12); border-radius:8px; }
        .hash-value { font-family:monospace; font-size:11px; color:rgba(99,179,237,0.7); word-break:break-all; line-height:1.6; margin-top:4px; }
        .footer { text-align:center; font-size:10px; color:rgba(255,255,255,0.13); letter-spacing:1px; line-height:1.8; position:relative; }
        @media print {
          .no-print { display:none !important; }
          body { background:#0a0f1e !important; }
          .cert-page { padding:0 !important; min-height:unset; background:linear-gradient(135deg,#0a0f1e 0%,#0f1729 50%,#0a1628 100%) !important; }
          .cert { border-radius:0; max-width:100%; }
          @page { size:A4; margin:12mm; }
        }
      `}</style>

      <div className="cert-page">
        <div className="nav no-print">
          <span className="nav-logo">TrustMesh</span>
          <PrintButton />
        </div>

        <div className="cert">
          <div className="corner tl"/><div className="corner tr"/>
          <div className="corner bl"/><div className="corner br"/>
          <div className="watermark">VERIFIED</div>

          <div className="header">
            <div className="logo-text">TrustMesh</div>
            <div className="logo-sub">Digital Media Certification Authority</div>
          </div>

          <div className="divider"/>
          <div className="cert-title">Certificate of Media Authentication</div>
          <div className="cert-id">ID: {certificate.certificateId}</div>

          <div className="status-badge">
            <div className="dot"/>
            Verified Authentic
          </div>

          <div className="fields">
            {fields.map(({ label, value }) => (
              <div className="field" key={label}>
                <div className="field-label">{label}</div>
                <div className="field-value">{value}</div>
              </div>
            ))}
          </div>

          <div className="hash-section">
            <div className="field-label">Perceptual Hash (dHash)</div>
            <div className="hash-value">{certificate.imageHash}</div>
          </div>

          <div className="divider"/>

          <div className="footer">
            This certificate was automatically generated by TrustMesh Portal<br/>
            Authenticated via decentralized perceptual hashing · {issuedDate}<br/>
            <span style={{ color:'rgba(99,179,237,0.25)', fontFamily:'monospace' }}>{certificate.certificateId}</span>
          </div>
        </div>
      </div>
    </>
  );
}