import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": dirname } },
  test: {
    environment: "happy-dom",
    globals: true,
    // Tests always run against the release default (social off), even when a
    // developer's .env.local enables the social surface for local dev.
    env: { VITE_SOCIAL_ENABLED: "false" },
    setupFiles: ["./tests/setup.ts"],
    exclude: [
      "tests/rules/**",
      "node_modules/**",
      ".next/**",
      "dist/**",
      "archive/**",
    ],
  },
});
