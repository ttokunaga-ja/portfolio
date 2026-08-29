import { existsSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const useExistingBuild = process.env.PORTFOLIO_USE_EXISTING_BUILD === "1";
const requiredBuildOutputs = [join(process.cwd(), "dist", "index.html"), join(process.cwd(), "dist", "assets")];

if (useExistingBuild && requiredBuildOutputs.some((path) => !existsSync(path))) {
  throw new Error("PORTFOLIO_USE_EXISTING_BUILD=1 requires a complete dist/ directory from pnpm build.");
}

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4176",
    trace: "on-first-retry"
  },
  webServer: {
    command: `${useExistingBuild ? "" : "pnpm build && "}pnpm preview --port 4176 --strictPort`,
    url: "http://127.0.0.1:4176",
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
