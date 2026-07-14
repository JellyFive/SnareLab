import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useState } from "react";

import { AppShellProvider } from "./AppShellContext";
import { BottomNavigation } from "../components/BottomNavigation";
import { SettingsPanel } from "../components/SettingsPanel";
import { ClassificationManagementSheet } from "../components/ClassificationManagementSheet";
import { LogPage } from "../pages/Log/LogPage";
import { StatisticsPage } from "../pages/Statistics/StatisticsPage";
import { TimerPage } from "../pages/Timer/TimerPage";
import { TodayPage } from "../pages/Today/TodayPage";
import { EditorPage } from "../pages/Editor/EditorPage";

function AppLayout() {
  const { pathname } = useLocation();
  const isTimerRoute = pathname === "/timer";
  const isEditorRoute = pathname === "/editor";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [managementKind, setManagementKind] = useState<"category" | "tag">();
  const [classificationRevision, setClassificationRevision] = useState(0);

  return (
    <AppShellProvider value={{ classificationRevision, notifyClassificationChanged: () => setClassificationRevision((current) => current + 1), openSettings: () => setSettingsOpen(true) }}>
      <div className={`app-shell${isTimerRoute ? " app-shell--timer" : ""}${isEditorRoute ? " app-shell--editor" : ""}`}>
        <main className="app-shell__content">
          <Outlet />
        </main>
        {!isTimerRoute && <BottomNavigation />}
        <SettingsPanel onClose={() => setSettingsOpen(false)} onOpenCategoryManagement={() => { setSettingsOpen(false); setManagementKind("category"); }} onOpenTagManagement={() => { setSettingsOpen(false); setManagementKind("tag"); }} open={settingsOpen} />
        {managementKind && <ClassificationManagementSheet kind={managementKind} onChanged={() => setClassificationRevision((current) => current + 1)} onClose={() => { setManagementKind(undefined); setSettingsOpen(true); }} />}
      </div>
    </AppShellProvider>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TodayPage />} />
        <Route path="timer" element={<TimerPage />} />
        <Route path="records" element={<LogPage />} />
        <Route path="log" element={<Navigate replace to="/records" />} />
        <Route path="category" element={<Navigate replace to="/" />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="editor" element={<EditorPage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Route>
    </Routes>
  );
}
