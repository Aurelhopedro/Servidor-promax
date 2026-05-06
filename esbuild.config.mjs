import { build } from "esbuild";

await build({
  entryPoints: ["src/api/mcp.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "api/mcp.mjs",
  external: [
    "@modelcontextprotocol/sdk",
    "dotenv",
    "axios",
    "zod",
    "uuid",
    "@vercel/node",
  ],
  banner: {
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
  },
});

console.log("✅ api/mcp.mjs built successfully");
