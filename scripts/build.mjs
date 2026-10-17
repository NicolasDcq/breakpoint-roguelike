// Construit le jeu dans dist/ (site statique, prêt pour Vercel).
//   npm run build            → dist/ minifié
//   npm run build -- --single → dist/index.html autonome (un seul fichier, pour un artifact ou itch.io)
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { basename } from "node:path";
import { execSync } from "node:child_process";

const single = process.argv.includes("--single");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
let commit = process.env.VERCEL_GIT_COMMIT_SHA || "";
if (!commit) {
  try {
    commit = execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {}
}

export const buildOptions = {
  entryPoints: ["src/main.jsx"],
  bundle: true,
  jsx: "automatic",
  target: ["es2020"],
  loader: { ".svg": "text" },
  define: {
    "process.env.NODE_ENV": '"production"',
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_COMMIT__: JSON.stringify(commit.slice(0, 7)),
    // Vercel : VERCEL_ENV vaut "production" pour la bêta en ligne, "preview" pour les branches.
    __DEV_TOOLS__: JSON.stringify(process.env.VERCEL_ENV !== "production"),
  },
  logLevel: "warning",
};

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

const result = await esbuild.build({
  ...buildOptions,
  minify: true,
  sourcemap: single ? false : "linked",
  outdir: "dist/assets",
  entryNames: single ? "[name]" : "[name]-[hash]",
  metafile: true,
  write: !single,
});

const template = readFileSync("index.html", "utf8");
let html;
if (single) {
  const js = result.outputFiles.find((f) => f.path.endsWith(".js")).text;
  const css = result.outputFiles.find((f) => f.path.endsWith(".css"))?.text ?? "";
  html = template
    .replace("<!--styles-->", `<style>${css}</style>`)
    .replace("<!--scripts-->", `<script>${js.replace(/<\/script/gi, "<\\/script")}</script>`);
} else {
  const outputs = Object.keys(result.metafile.outputs);
  const js = outputs.find((f) => f.endsWith(".js"));
  const css = outputs.find((f) => f.endsWith(".css"));
  html = template
    .replace("<!--styles-->", css ? `<link rel="stylesheet" href="/assets/${basename(css)}" />` : "")
    .replace("<!--scripts-->", `<script type="module" src="/assets/${basename(js)}"></script>`);
}
writeFileSync("dist/index.html", html);
console.log(`Breakpoint ${pkg.version}${commit ? " (" + commit.slice(0, 7) + ")" : ""} → dist/${single ? "index.html (fichier unique)" : ""}`);
