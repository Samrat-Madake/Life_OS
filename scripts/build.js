import { spawnSync } from "node:child_process";

// If running in a backend-only environment like Render, skip client bundle
if (process.env.RENDER) {
  console.log("==> Render environment detected (backend API): skipping Vite frontend build.");
  process.exit(0);
}

// Otherwise (Vercel, local build, CI), build the Vite client application
console.log("==> Building LifeOS client application with TypeScript & Vite...");
const result = spawnSync("npm", ["run", "build:client"], {
  stdio: "inherit",
  shell: true
});

process.exit(result.status ?? 0);
