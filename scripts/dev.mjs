// Serveur de développement : reconstruit à chaque modification.
//   npm run dev → http://localhost:5173
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
mkdirSync(".dev/assets", { recursive: true });
writeFileSync(
  ".dev/index.html",
  readFileSync("index.html", "utf8")
    .replace("<!--styles-->", '<link rel="stylesheet" href="/assets/main.css" />')
    .replace("<!--scripts-->", '<script type="module" src="/assets/main.js"></script>\n    <script>new EventSource("/esbuild").addEventListener("change", () => location.reload())</script>'),
);

const ctx = await esbuild.context({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  jsx: "automatic",
  sourcemap: true,
  loader: { ".svg": "text" },
  define: {
    "process.env.NODE_ENV": '"development"',
    __APP_VERSION__: JSON.stringify(pkg.version + "-dev"),
    __APP_COMMIT__: '""',
    __DEV_TOOLS__: "true",
  },
  outdir: ".dev/assets",
  logLevel: "info",
});
await ctx.watch();
const { port } = await ctx.serve({ servedir: ".dev", port: Number(process.env.PORT) || 5173 });
console.log(`Breakpoint en développement : http://localhost:${port}`);
