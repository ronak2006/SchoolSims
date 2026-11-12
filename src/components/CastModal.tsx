import type { UIStrings, SimData, TextImageNode } from '../types';

interface CastModalProps {
  ui: UIStrings | undefined;
  simData: SimData | null;
  onClose: () => void;
}

export default function CastModal({ ui, simData, onClose }: CastModalProps) {
  return (
    <div id="modal-cast" className="modal-panel modal-enter" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 480, overflow: 'hidden', zIndex: 50 }}>
      {/* Header strip */}
      <div style={{ position: 'relative', padding: '20px 24px 20px', background: 'linear-gradient(135deg,#1e293b,#0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#C4B5FD', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>{ui?.cast_panel_label ?? 'Cast'}</p>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{ui?.cast_panel_subtitle ?? 'Featured Character'}</p>
        </div>
        <button onClick={onClose} className="rail-btn" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      {/* Body */}
      <div style={{ padding: '24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ width: 110, height: 130, borderRadius: 14, overflow: 'hidden', border: '2px solid var(--border)', background: 'var(--surface2)', flexShrink: 0 }}>
          {simData?.media.photo && <img src={simData.media.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={ui?.cast_panel_subtitle ?? ''} onError={e => (e.currentTarget.style.display = 'none')} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p id="cast-name" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            {simData ? (simData.nodes['text_image'] as TextImageNode)?.character_name : 'Jordan Chen'}
          </p>
          <p id="cast-role" style={{ fontSize: 13, color: 'var(--purple)', fontWeight: 600, margin: '0 0 16px' }}>
            {simData ? (simData.nodes['text_image'] as TextImageNode)?.character_title : 'VP of Digital Learning'}
          </p>
          <div className="callout">
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>{ui?.cast_panel_body ?? ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
