/**
 * vite-plugin-upload.js
 *
 * Vite dev-server middleware that handles POST /api/upload locally.
 * Mirrors the same upload logic as worker/index.js so you never need
 * `wrangler dev` running just to test file uploads during development.
 *
 * Fallback chain: Catbox → Pomf → Quax → Uguu → Cloudku
 */


function detectMime(buf) {
  const h = (n) => buf[n];
  if (h(0) === 0xFF && h(1) === 0xD8 && h(2) === 0xFF) return { mime: "image/jpeg", ext: "jpg" };
  if (h(0) === 0x89 && h(1) === 0x50 && h(2) === 0x4E && h(3) === 0x47) return { mime: "image/png", ext: "png" };
  if (h(0) === 0x47 && h(1) === 0x49 && h(2) === 0x46) return { mime: "image/gif", ext: "gif" };
  if (h(0) === 0x52 && h(1) === 0x49 && h(2) === 0x46 && h(3) === 0x46 &&
    h(8) === 0x57 && h(9) === 0x45 && h(10) === 0x42 && h(11) === 0x50) return { mime: "image/webp", ext: "webp" };
  if (h(4) === 0x66 && h(5) === 0x74 && h(6) === 0x79 && h(7) === 0x70) return { mime: "video/mp4", ext: "mp4" };
  if (h(0) === 0x1A && h(1) === 0x45 && h(2) === 0xDF && h(3) === 0xA3) return { mime: "video/webm", ext: "webm" };
  if ((h(0) === 0xFF && (h(1) & 0xE0) === 0xE0) ||
    (h(0) === 0x49 && h(1) === 0x44 && h(2) === 0x33)) return { mime: "audio/mpeg", ext: "mp3" };
  if (h(0) === 0x4F && h(1) === 0x67 && h(2) === 0x67 && h(3) === 0x53) return { mime: "audio/ogg", ext: "ogg" };
  if (h(0) === 0x25 && h(1) === 0x50 && h(2) === 0x44 && h(3) === 0x46) return { mime: "application/pdf", ext: "pdf" };
  if (h(0) === 0x50 && h(1) === 0x4B) return { mime: "application/zip", ext: "zip" };
  return { mime: "application/octet-stream", ext: "bin" };
}


async function tryCatbox(buf, t) {
  const { FormData, Blob, fetch } = globalThis;
  const form = new FormData();
  form.append("fileToUpload", new Blob([buf], { type: t.mime }), `sannasa-${Date.now()}.${t.ext}`);
  form.append("userhash", "");
  form.append("reqtype", "fileupload");
  const r = await fetch("https://catbox.moe/user/api.php", {
    method: "POST", body: form,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Origin": "https://catbox.moe"
    }
  });
  if (!r.ok) throw new Error(`Catbox HTTP ${r.status}`);
  const url = (await r.text()).trim();
  if (!url.startsWith("http")) throw new Error(`Catbox bad response: ${url}`);
  return url;
}

async function tryLitterbox(buf, t) {
  const { FormData, Blob, fetch } = globalThis;
  const form = new FormData();
  form.append("fileToUpload", new Blob([buf], { type: t.mime }), `sannasa-${Date.now()}.${t.ext}`);
  form.append("reqtype", "fileupload");
  form.append("time", "72h");
  const r = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
    method: "POST", body: form,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Origin": "https://litterbox.catbox.moe"
    }
  });
  if (!r.ok) throw new Error(`Litterbox HTTP ${r.status}`);
  const url = (await r.text()).trim();
  if (!url.startsWith("http")) throw new Error(`Litterbox bad response: ${url}`);
  return url;
}

async function tryPomf(buf, t) {
  const { FormData, Blob, fetch } = globalThis;
  const form = new FormData();
  form.append("files[]", new Blob([buf], { type: t.mime }), `sannasa-${Date.now()}.${t.ext}`);
  const r = await fetch("https://pomf.lain.la/upload.php", {
    method: "POST", body: form,
    headers: { origin: "https://pomf.lain.la", "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
  });
  if (!r.ok) throw new Error(`Pomf HTTP ${r.status}`);
  const json = await r.json();
  let url = json?.files?.[0]?.url;
  if (!url) throw new Error("Pomf: no URL");
  if (url.startsWith("//")) url = "https:" + url;
  return url;
}

async function tryQuax(buf, t) {
  const { FormData, Blob, fetch } = globalThis;
  const form = new FormData();
  form.append("files[]", new Blob([buf], { type: t.mime }), `sannasa-${Date.now()}.${t.ext}`);
  const r = await fetch("https://qu.ax/upload.php", {
    method: "POST", body: form,
    headers: { origin: "https://qu.ax", "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
  });
  if (!r.ok) throw new Error(`Quax HTTP ${r.status}`);
  const json = await r.json();
  const name = json?.files?.[0]?.name;
  if (!name) throw new Error("Quax: no filename in response");

  return `https://qu.ax/x/${name}`;
}

async function tryUguu(buf, t) {
  const { FormData, Blob, fetch } = globalThis;
  const form = new FormData();
  form.append("files[]", new Blob([buf], { type: t.mime }), `sannasa-${Date.now()}.${t.ext}`);
  const r = await fetch("https://uguu.se/upload", {
    method: "POST", body: form,
    headers: { origin: "https://uguu.se", "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
  });
  if (!r.ok) throw new Error(`Uguu HTTP ${r.status}`);
  const json = await r.json();
  const url = json?.files?.[0]?.url;
  if (!url) throw new Error("Uguu: no URL");
  return url;
}

async function tryCloudku(buf, t) {
  const { FormData, Blob, fetch } = globalThis;
  const form = new FormData();
  form.append("file", new Blob([buf], { type: t.mime }), `sannasa-${Date.now()}.${t.ext}`);
  const r = await fetch("https://cloudkuimages.guru/upload.php", {
    method: "POST", body: form,
    headers: { origin: "https://cloudkuimages.guru", "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
  });
  if (!r.ok) throw new Error(`Cloudku HTTP ${r.status}`);
  const json = await r.json();
  const url = json?.data?.url;
  if (!url) throw new Error("Cloudku: no URL");
  return url;
}

async function uploadWithFallback(buffer) {
  const uint8 = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const typeInfo = detectMime(uint8);

  const services = [
    { name: "Catbox", fn: () => tryCatbox(uint8, typeInfo) },
    { name: "Litterbox", fn: () => tryLitterbox(uint8, typeInfo) },
    { name: "Pomf", fn: () => tryPomf(uint8, typeInfo) },
    { name: "Quax", fn: () => tryQuax(uint8, typeInfo) },
    { name: "Uguu", fn: () => tryUguu(uint8, typeInfo) },
    { name: "Cloudku", fn: () => tryCloudku(uint8, typeInfo) },
  ];

  const errors = [];
  for (const svc of services) {
    try {
      console.log(`  [upload-dev] Trying ${svc.name}...`);
      const url = await svc.fn();
      console.log(`  [upload-dev] ✓ ${svc.name} → ${url}`);
      return { url, service: svc.name };
    } catch (e) {
      console.warn(`  [upload-dev] ✗ ${svc.name}: ${e.message}`);
      errors.push(`${svc.name}: ${e.message}`);
    }
  }
  throw new Error("All upload services failed:\n" + errors.join("\n"));
}


async function parseFile(req) {

  const busboy = (await import("busboy")).default;
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    bb.on("file", (_name, stream, info) => {
      const chunks = [];
      stream.on("data", (d) => chunks.push(d));
      stream.on("end", () => resolve({ buffer: Buffer.concat(chunks), info }));
      stream.on("error", reject);
    });
    bb.on("error", reject);
    bb.on("close", () => {

    });
    req.pipe(bb);
  });
}


export default function uploadPlugin() {
  return {
    name: "vite-plugin-upload",
    apply: "serve",

    configureServer(server) {

      server.middlewares.use("/media", async (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const targetUrl = url.searchParams.get("url");
        if (!targetUrl) {
          res.writeHead(400);
          res.end("Missing url");
          return;
        }

        try {
          const { fetch } = globalThis;
          const mediaRes = await fetch(targetUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            }
          });

          if (!mediaRes.ok) {
            res.writeHead(mediaRes.status);
            res.end(`Failed to fetch media: ${mediaRes.status}`);
            return;
          }


          res.setHeader("Access-Control-Allow-Origin", "*");
          const contentType = mediaRes.headers.get("Content-Type");
          if (contentType) res.setHeader("Content-Type", contentType);


          const reader = mediaRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (err) {
          console.error("  [media-dev] Proxy error:", err.message);
          res.writeHead(500);
          res.end(`Proxy error: ${err.message}`);
        }
      });

      server.middlewares.use("/api/upload", async (req, res) => {

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        if (req.method !== "POST") {
          res.writeHead(405, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        try {
          const { buffer } = await parseFile(req);

          if (!buffer || buffer.length === 0) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "No file or empty file" }));
            return;
          }

          const result = await uploadWithFallback(buffer);


          const host = req.headers.host;
          const protocol = req.headers['x-forwarded-proto'] || 'http';
          const proxiedUrl = `${protocol}://${host}/media?url=${encodeURIComponent(result.url)}`;

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ url: proxiedUrl, service: result.service }));
        } catch (err) {
          console.error("  [upload-dev] Error:", err.message);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}
