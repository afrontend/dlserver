import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["server.test.ts"],
    exclude: ["src/**", "node_modules/**", "package.test.ts"],
  },
});
