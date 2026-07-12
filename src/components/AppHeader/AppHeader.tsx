import { Settings } from "lucide-react";
import type { ReactNode } from "react";

import snareLabMark from "../../assets/snarelab-mark.svg";

interface AppHeaderProps {
  onOpenSettings: () => void;
  title: string;
  titleId?: string;
  trailing?: ReactNode;
}

export function AppHeader({ onOpenSettings, title, titleId, trailing }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__brand-row">
        <span className="app-header__brand">
          <img alt="SnareLab 标识" className="app-header__brand-mark" src={snareLabMark} />
          <span className="app-header__brand-name">SnareLab</span>
        </span>
        <button aria-label="打开设置" className="icon-button" onClick={onOpenSettings} type="button">
          <Settings aria-hidden="true" size={21} strokeWidth={2.5} />
        </button>
      </div>
      <div className="app-header__page-row">
        <h1 id={titleId}>{title}</h1>
        {trailing}
      </div>
    </header>
  );
}
