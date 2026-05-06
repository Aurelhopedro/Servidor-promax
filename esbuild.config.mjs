import { build } from "esbuild";

await build({
  entryPoints: ["src/api/mcp.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "api/mcp.js",
  external: [
    "@modelcontextprotocol/sdk",
    "dotenv",
    "axios",
    "zod",
    "uuid",
  ],
  banner: {
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
  },
});

console.log("✅ api/mcp.js built successfully");
