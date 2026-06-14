/**
 * Sannasa Cloudflare Worker
 * Supports: Catbox → Pomf → Quax → Uguu → Cloudku (fallback chain)
 */

function detectMime(uint8) {
  const h = (n) => uint8[n];
  if (h(0) === 0xFF && h(1) === 0xD8 && h(2) === 0xFF) return { mime: "image/jpeg", ext: "jpg" };
  if (h(0) === 0x89 && h(1) === 0x50 && h(2) === 0x4E && h(3) === 0x47) return { mime: "image/png", ext: "png" };
  if (h(0) === 0x47 && h(1) === 0x49 && h(2) === 0x46) return { mime: "image/gif", ext: "gif" };
  if (h(0) === 0x52 && h(1) === 0x49 && h(2) === 0x46 && h(3) === 0x46 &&
    h(8) === 0x57 && h(9) === 0x45 && h(10) === 0x42 && h(11) === 0x50) return { mime: "image/webp", ext: "webp" };
  if ((h(4) === 0x66 && h(5) === 0x74 && h(6) === 0x79 && h(7) === 0x70) ||
    (h(0) === 0x00 && h(1) === 0x00 && h(2) === 0x00)) return { mime: "video/mp4", ext: "mp4" };
  if (h(0) === 0x1A && h(1) === 0x45 && h(2) === 0xDF && h(3) === 0xA3) return { mime: "video/webm", ext: "webm" };
  if ((h(0) === 0xFF && (h(1) & 0xE0) === 0xE0) || (h(0) === 0x49 && h(1) === 0x44 && h(2) === 0x33)) return { mime: "audio/mpeg", ext: "mp3" };
  if (h(0) === 0x4F && h(1) === 0x67 && h(2) === 0x67 && h(3) === 0x53) return { mime: "audio/ogg", ext: "ogg" };
  if (h(0) === 0x25 && h(1) === 0x50 && h(2) === 0x44 && h(3) === 0x46) return { mime: "application/pdf", ext: "pdf" };
  if (h(0) === 0x50 && h(1) === 0x4B) return { mime: "application/zip", ext: "zip" };
  return { mime: "application/octet-stream", ext: "bin" };
}

async function uploadCatbox(uint8, typeInfo) {
  const blob = new Blob([uint8], { type: typeInfo.mime });
  const form = new FormData();
  form.append("fileToUpload", blob, `sannasa-${Date.now()}.${typeInfo.ext}`);
  form.append("userhash", "");
  form.append("reqtype", "fileupload");
  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: form,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Origin": "https://catbox.moe"
    }
  });
  if (!res.ok) throw new Error(`Catbox HTTP ${res.status}`);
  const url = (await res.text()).trim();
  if (!url.startsWith("http")) throw new Error(`Catbox bad response: ${url}`);
  return url;
}

async function uploadLitterbox(uint8, typeInfo) {
  const blob = new Blob([uint8], { type: typeInfo.mime });
  const form = new FormData();
  form.append("fileToUpload", blob, `sannasa-${Date.now()}.${typeInfo.ext}`);
  form.append("reqtype", "fileupload");
  form.append("time", "72h");
  const res = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
    method: "POST",
    body: form,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Origin": "https://litterbox.catbox.moe"
    }
  });
  if (!res.ok) throw new Error(`Litterbox HTTP ${res.status}`);
  const url = (await res.text()).trim();
  if (!url.startsWith("http")) throw new Error(`Litterbox bad response: ${url}`);
  return url;
}

async function uploadPomf(uint8, typeInfo) {
  const blob = new Blob([uint8], { type: typeInfo.mime });
  const form = new FormData();
  form.append("files[]", blob, `sannasa-${Date.now()}.${typeInfo.ext}`);
  const res = await fetch("https://pomf.lain.la/upload.php", {
    method: "POST",
    body: form,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Origin": "https://pomf.lain.la"
    }
  });
  if (!res.ok) throw new Error(`Pomf HTTP ${res.status}`);
  const json = await res.json();
  let url = json?.files?.[0]?.url;
  if (!url) throw new Error("Pomf: no URL");
  if (url.startsWith("//")) url = "https:" + url;
  return url;
}

async function uploadQuax(uint8, typeInfo) {
  const blob = new Blob([uint8], { type: typeInfo.mime });
  const form = new FormData();
  form.append("files[]", blob, `sannasa-${Date.now()}.${typeInfo.ext}`);
  const res = await fetch("https://qu.ax/upload.php", {
    method: "POST",
    body: form,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Origin": "https://qu.ax"
    }
  });
  if (!res.ok) throw new Error(`Quax HTTP ${res.status}`);
  const json = await res.json();
  const name = json?.files?.[0]?.name;
  if (!name) throw new Error("Quax: no filename in response");

  return `https://qu.ax/x/${name}`;
}

async function uploadUguu(uint8, typeInfo) {
  const blob = new Blob([uint8], { type: typeInfo.mime });
  const form = new FormData();
  form.append("files[]", blob, `sannasa-${Date.now()}.${typeInfo.ext}`);
  const res = await fetch("https://uguu.se/upload", {
    method: "POST",
    body: form,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Origin": "https://uguu.se"
    }
  });
  if (!res.ok) throw new Error(`Uguu HTTP ${res.status}`);
  const json = await res.json();
  let url = json?.files?.[0]?.url;
  if (!url) throw new Error("Uguu: no URL");
  return url;
}

async function uploadCloudku(uint8, typeInfo) {
  const blob = new Blob([uint8], { type: typeInfo.mime });
  const form = new FormData();
  form.append("file", blob, `sannasa-${Date.now()}.${typeInfo.ext}`);
  const res = await fetch("https://cloudkuimages.guru/upload.php", {
    method: "POST",
    body: form,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Origin": "https://cloudkuimages.guru"
    }
  });
  if (!res.ok) throw new Error(`Cloudku HTTP ${res.status}`);
  const json = await res.json();
  const url = json?.data?.url;
  if (!url) throw new Error("Cloudku: no URL");
  return url;
}

async function uploadWithFallback(uint8, fileName, fileMime) {
  let typeInfo = detectMime(uint8);
  if (fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'webm') typeInfo = { mime: fileMime || 'audio/webm', ext: 'webm' };
    else if (ext === 'ogg') typeInfo = { mime: fileMime || 'audio/ogg', ext: 'ogg' };
    else if (ext === 'mp4') typeInfo = { mime: fileMime || 'audio/mp4', ext: 'mp4' };
    else if (ext === 'mp3') typeInfo = { mime: fileMime || 'audio/mpeg', ext: 'mp3' };
    else if (typeInfo.ext === 'bin') typeInfo = { mime: fileMime || 'application/octet-stream', ext };
  }
  const services = [
    { name: "Catbox", fn: () => uploadCatbox(uint8, typeInfo) },
    { name: "Litterbox", fn: () => uploadLitterbox(uint8, typeInfo) },
    { name: "Pomf", fn: () => uploadPomf(uint8, typeInfo) },
    { name: "Quax", fn: () => uploadQuax(uint8, typeInfo) },
    { name: "Uguu", fn: () => uploadUguu(uint8, typeInfo) },
    { name: "Cloudku", fn: () => uploadCloudku(uint8, typeInfo) },
  ];
  const errors = [];
  for (const svc of services) {
    try {
      const url = await svc.fn();
      console.log(`[Upload] ✓ ${svc.name}: ${url}`);
      return { url, service: svc.name };
    } catch (err) {
      console.warn(`[Upload] ✗ ${svc.name}: ${err.message}`);
      errors.push(`${svc.name}: ${err.message}`);
    }
  }
  throw new Error("All upload services failed:\n" + errors.join("\n"));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", version: "1.0.1" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }


    if (url.pathname === "/media") {
      const targetUrl = url.searchParams.get("url");
      if (!targetUrl) return new Response("Missing url", { status: 400 });
      try {
        const mediaRes = await fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          }
        });
        if (!mediaRes.ok) return new Response(`Failed to fetch media: ${mediaRes.status}`, { status: mediaRes.status });
        const headers = new Headers(mediaRes.headers);
        headers.set("Access-Control-Allow-Origin", "*");
        headers.delete("Set-Cookie");
        headers.delete("Content-Disposition");
        return new Response(mediaRes.body, { status: mediaRes.status, headers });
      } catch (err) {
        return new Response(`Proxy error: ${err.message}`, { status: 500 });
      }
    }

    if (url.pathname === "/api/upload" && request.method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file) return new Response(JSON.stringify({ error: "No file provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const arrayBuffer = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        if (uint8.length === 0) return new Response(JSON.stringify({ error: "File is empty" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const result = await uploadWithFallback(uint8, file.name, file.type);
        let finalUrl = result.url;
        if (finalUrl.startsWith("//")) finalUrl = "https:" + finalUrl;


        const proxiedUrl = `${url.origin}/media?url=${encodeURIComponent(finalUrl)}`;

        return new Response(JSON.stringify({ url: proxiedUrl, service: result.service }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (err) {
        console.error("[Worker] Upload error:", err);
        return new Response(JSON.stringify({ error: err.message || "Upload failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !url.pathname.includes('.')) {
      return env.ASSETS.fetch(new URL('/index.html', url.origin));
    }
    return response;
  },
};
