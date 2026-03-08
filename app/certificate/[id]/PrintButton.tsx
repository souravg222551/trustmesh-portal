'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: '8px 20px',
        borderRadius: '8px',
        border: '1px solid rgba(59,130,246,0.4)',
        background: 'rgba(59,130,246,0.1)',
        color: '#93c5fd',
        fontSize: '13px',
        cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      🖨 Print / Save PDF
    </button>
  );
}