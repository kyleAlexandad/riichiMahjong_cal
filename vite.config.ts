import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Base URL for `dist/index.html` asset links.
 * - Subpath: `VITE_BASE=/your-repo/ npm run build` then copy `dist` to that branch
 * - User site root: `VITE_BASE=/` or default `./` if opening index locally
 */
export default defineConfig({
  base: process.env.VITE_BASE ?? "./",
  plugins: [react()],
});
