import { ChartNoAxesCombined, House, List } from "lucide-react";
import { NavLink } from "react-router-dom";

const navigationItems = [
  { icon: House, label: "今日", to: "/" },
  { icon: List, label: "记录", to: "/records" },
  { icon: ChartNoAxesCombined, label: "统计", to: "/statistics" },
];

export function BottomNavigation() {
  return (
    <nav aria-label="主导航" className="bottom-navigation">
      <div className="bottom-navigation__content">
        {navigationItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              `bottom-navigation__link${isActive ? " bottom-navigation__link--active" : ""}`
            }
            end={item.to === "/"}
            key={item.to}
            to={item.to}
          >
            <item.icon aria-hidden="true" className="bottom-navigation__icon" size={19} strokeWidth={2.2} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
