import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import app from "./api/_app";

async function readRequestBody(req: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function apiMiddleware() {
  return {
    name: "cpr-hono-api-dev",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use("/api", async (req, res) => {
        try {
          const url = new URL(req.originalUrl || req.url || "/", "http://127.0.0.1");
          const method = req.method || "GET";
          const headers = new Headers();

          for (const [key, value] of Object.entries(req.headers)) {
            if (Array.isArray(value)) {
              value.forEach((item) => headers.append(key, item));
            } else if (value !== undefined) {
              headers.set(key, value);
            }
          }

          const hasBody = !["GET", "HEAD"].includes(method);
          const body = hasBody ? await readRequestBody(req) : undefined;
          const response = await app.fetch(
            new Request(url, {
              method,
              headers,
              body,
            })
          );

          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          const responseBody = Buffer.from(await response.arrayBuffer());
          res.end(responseBody);
        } catch (error) {
          server.config.logger.error(error instanceof Error ? error.stack || error.message : String(error));
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "API route failed" }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [apiMiddleware(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5173,
    strictPort: true,
    hmr: false,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
