import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, "index.html"),
        research: resolve(__dirname, "research/index.html"),
        projects: resolve(__dirname, "projects/index.html"),
        experience: resolve(__dirname, "experience/index.html"),
        skills: resolve(__dirname, "skills/index.html"),
        contact: resolve(__dirname, "contact/index.html")
      }
    }
  }
});
