import { ChevronRight, Palette, Tags } from "lucide-react";

import { useDialogFocus } from "../../hooks/useDialogFocus";

interface SettingsPanelProps {
  onClose: () => void;
  open: boolean;
}

export function SettingsPanel({ onClose, open }: SettingsPanelProps) {
  const dialogRef = useDialogFocus(open);

  if (!open) return null;

  return (
    <div className="settings-panel__backdrop">
      <section aria-label="设置" aria-modal="true" className="settings-panel" ref={dialogRef} role="dialog">
        <div className="settings-panel__header">
          <h2>设置</h2>
          <button aria-label="关闭设置" className="icon-button" data-dialog-initial-focus onClick={onClose} type="button">关闭</button>
        </div>
        <div className="settings-panel__list">
          <button className="settings-panel__row" type="button">
            <span><Tags aria-hidden="true" size={18} />分类管理</span>
            <ChevronRight aria-hidden="true" size={18} />
          </button>
          <button className="settings-panel__row" type="button">
            <span><Tags aria-hidden="true" size={18} />标签管理</span>
            <ChevronRight aria-hidden="true" size={18} />
          </button>
          <button aria-label="页面主题，即将开放" className="settings-panel__row" disabled type="button">
            <span><Palette aria-hidden="true" size={18} />页面主题</span>
            <small>即将开放</small>
          </button>
        </div>
      </section>
    </div>
  );
}
