import { BrowserRouter } from "react-router-dom";

import { AppProviders } from "@/components/providers/app-providers";
import { AppRoutes } from "@/src/router";

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
}
