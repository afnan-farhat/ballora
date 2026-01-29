import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";


import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  test: {
    globals: true,          // ← FIX expect is not defined
    environment: "jsdom",   // Required for React Testing
   setupFiles: "./src/setupTests.ts", // Load jest-dom
  },
});




