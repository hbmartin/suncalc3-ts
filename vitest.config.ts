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
    },
  },
});
