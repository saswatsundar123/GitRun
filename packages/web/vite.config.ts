import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    headers: {
      // Required for @webcontainer/api and Pyodide SharedArrayBuffers.
      // Both hard-require cross-origin isolation.
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },

  optimizeDeps: {
    // @webcontainer/api is ESM-only and must not be pre-bundled by Vite.
    exclude: ["@webcontainer/api"],
  },

  build: {
    target: "esnext",
    sourcemap: true,
  },
});
