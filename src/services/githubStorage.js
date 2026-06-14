/**
 * Media Upload Service
 * Sends files to the Cloudflare Worker /api/upload endpoint.
 */
export const uploadToGithub = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    const text = await response.text();
    throw new Error(`Upload failed (${response.status}): ${text.substring(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(data?.error || `Upload failed with status ${response.status}`);
  }

  if (!data?.url) {
    throw new Error("Upload succeeded but no URL was returned");
  }

  return data.url;
};
