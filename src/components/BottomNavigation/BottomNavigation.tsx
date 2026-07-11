import { NavLink } from "react-router-dom";

const navigationItems = [
  { label: "Today", to: "/" },
  { label: "Log", to: "/log" },
  { label: "Category", to: "/category" },
  { label: "Statistics", to: "/statistics" },
];

export function BottomNavigation() {
  return (
    <nav aria-label="Primary navigation" className="bottom-navigation">
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
            <span aria-hidden="true" className="bottom-navigation__marker" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
