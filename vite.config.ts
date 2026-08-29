import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        about: resolve(import.meta.dirname, "about/index.html"),
        research: resolve(import.meta.dirname, "research/index.html"),
        projects: resolve(import.meta.dirname, "projects/index.html"),
        experience: resolve(import.meta.dirname, "experience/index.html"),
        blog: resolve(import.meta.dirname, "blog/index.html"),
        skills: resolve(import.meta.dirname, "skills/index.html"),
        contact: resolve(import.meta.dirname, "contact/index.html"),
        privacy: resolve(import.meta.dirname, "privacy/index.html")
      }
    }
  }
});
