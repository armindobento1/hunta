import { BrowserRouter } from "react-router-dom";

import { AppProviders } from "@/components/providers/app-providers";
import { NavigationGestures } from "@/components/providers/navigation-gestures";
import { AppRoutes } from "@/src/router";

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <NavigationGestures />
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
}
