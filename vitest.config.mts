import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: { "server-only": fileURLToPath(new URL("./src/test/server-only.ts", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.spec.{ts,tsx}"],
    css: {
      modules: { classNameStrategy: "non-scoped" },
    },
  },
});
