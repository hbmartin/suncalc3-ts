import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The reference values in the test suite were computed for UTC;
    // pin the timezone so tests pass regardless of the host timezone.
    env: { TZ: "UTC" },
    include: ["tests/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // Types-only module: erased at runtime, so v8 reports it as 0%.
      exclude: ["src/types.ts"],
      reporter: ["text", "html", "lcov"],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 100,
        lines: 90,
      },
    },
  },
});
