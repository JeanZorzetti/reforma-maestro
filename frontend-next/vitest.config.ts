import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "next/server": "next/server.js",
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // truncate-entre-casos em tests/setup.ts assume um único banco de teste
    // compartilhado — arquivos em paralelo se truncam uns aos outros no meio.
    fileParallelism: false,
    server: {
      deps: {
        inline: [/next-auth/, /@auth\/drizzle-adapter/, /^next$/],
      },
    },
  },
});
