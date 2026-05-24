import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  ssr: {
    noExternal: ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"]
  },
  build: {
    ssr: "src/entry-server.tsx",
    outDir: "dist/server",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: "es"
      }
    }
  }
});
