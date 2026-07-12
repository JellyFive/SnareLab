import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "./router";

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppRoutes />
    </BrowserRouter>
  );
}
