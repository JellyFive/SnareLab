import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

import { BottomNavigation } from "../components/BottomNavigation";
import { CategoryPage } from "../pages/Category/CategoryPage";
import { LogPage } from "../pages/Log/LogPage";
import { StatisticsPage } from "../pages/Statistics/StatisticsPage";
import { TimerPage } from "../pages/Timer/TimerPage";
import { TodayPage } from "../pages/Today/TodayPage";

type PagePlaceholderProps = {
  title: string;
};

function PagePlaceholder({ title }: PagePlaceholderProps) {
  return (
    <article className="page-placeholder" aria-labelledby="page-title">
      <p className="page-placeholder__product">SnareLab</p>
      <h1 id="page-title">{title}</h1>
      <div aria-hidden="true" className="page-placeholder__surface" />
    </article>
  );
}

function AppLayout() {
  const { pathname } = useLocation();
  const isTimerRoute = pathname === "/timer";

  return (
    <div className={isTimerRoute ? "app-shell app-shell--timer" : "app-shell"}>
      <main className="app-shell__content">
        <Outlet />
      </main>
      {!isTimerRoute && <BottomNavigation />}
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TodayPage />} />
        <Route path="timer" element={<TimerPage />} />
        <Route path="log" element={<LogPage />} />
        <Route path="category" element={<CategoryPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  );
}
