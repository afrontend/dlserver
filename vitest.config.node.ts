import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["server.test.ts", "mcpAnalytics.test.ts", "librarySearch.test.ts", "extension/**/*.test.js"],
    exclude: ["src/**", "node_modules/**", "package.test.ts"],
  },
});
