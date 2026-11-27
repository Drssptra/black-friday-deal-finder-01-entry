// A tiny static server for app/ (Node 22, standard library only), so the
// site can be run locally without a build step: `node serve.ts` serves app/
// on http://localhost:8080 (`--port <n>` for another port). Development
// convenience only, not part of the graded entry.
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("./app", import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf("--port");
const requested = portIndex === -1 ? 8080 : Number(args[portIndex + 1]);
const port = Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = createServer((req, res) => {
  const raw = decodeURIComponent((req.url || "/").split("?")[0]);
  const rel = normalize(raw).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]/, "");
  const path = join(root, rel === "" ? "index.html" : rel);
  if (!path.startsWith(root + sep) && path !== root) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  let stat;
  try {
    stat = statSync(path);
  } catch {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const file = stat.isDirectory() ? join(path, "index.html") : path;
  try {
    statSync(file);
  } catch {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`Serving app/ at http://localhost:${port}`);
});
