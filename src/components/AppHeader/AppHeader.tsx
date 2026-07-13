import { Settings } from "lucide-react";
import type { ReactNode } from "react";

import snareLabMark from "../../assets/snarelab-mark.svg";

interface AppHeaderProps {
  centeredTitle?: boolean;
  leading?: ReactNode;
  onOpenSettings: () => void;
  title: string;
  titleAccessory?: ReactNode;
  titleId?: string;
  trailing?: ReactNode;
}

export function AppHeader({ centeredTitle = false, leading, onOpenSettings, title, titleAccessory, titleId, trailing }: AppHeaderProps) {
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
      <div className={`app-header__page-row ${centeredTitle ? "app-header__page-row--centered" : ""}`}>
        {centeredTitle && <div className="app-header__page-side">{leading}</div>}
        <h1 id={titleId}><span>{title}</span>{titleAccessory}</h1>
        {centeredTitle ? <div className="app-header__page-side app-header__page-side--end">{trailing}</div> : trailing}
      </div>
    </header>
  );
}
