import type { UIStrings } from '../types';

interface HelpModalProps {
  ui: UIStrings;
  onClose: () => void;
}

export default function HelpModal({ ui, onClose }: HelpModalProps) {
  return (
    <div id="modal-help" className="modal-panel modal-enter" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 420, padding: 28, zIndex: 50 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>{ui.help_panel_title}</h3>
        <button onClick={onClose} className="rail-btn" style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      {[{ t: ui.help_safe_title, b: ui.help_safe_body }, { t: ui.help_no_right_title, b: ui.help_no_right_body }, { t: ui.help_replay_title, b: ui.help_replay_body }].map(({ t, b }) => (
        <div key={t} className="callout" style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px' }}>{t}</p>
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>{b}</p>
        </div>
      ))}
    </div>
  );
}
