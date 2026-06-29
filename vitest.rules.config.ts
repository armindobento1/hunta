import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": dirname } },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/rules/**/*.test.ts"],
    maxWorkers: 1,
    fileParallelism: false,
  },
});
