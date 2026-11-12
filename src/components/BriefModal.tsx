import type { UIStrings } from '../types';

interface BriefModalProps {
  ui: UIStrings;
  onClose: () => void;
}

export default function BriefModal({ ui, onClose }: BriefModalProps) {
  return (
    <div className="modal-panel modal-enter" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 480, padding: 28, zIndex: 50 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--purple)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 3px' }}>{ui.brief_scenario_label}</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>{ui.brief_scenario_body}</p>
        </div>
        <button onClick={onClose} className="rail-btn" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="callout" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--purple)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>{ui.brief_objective_label}</p>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>{ui.brief_objective_body}</p>
      </div>
    </div>
  );
}
