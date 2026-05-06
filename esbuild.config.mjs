import { build } from "esbuild";

await build({
  entryPoints: ["src/api/mcp.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "api/mcp.js",
  external: [],
  minify: false,
});

console.log("✅ api/mcp.js built successfully");
