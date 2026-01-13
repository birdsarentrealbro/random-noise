self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  const parts = url.pathname.split("/").filter(Boolean);

  let w = 500;
  let h = 500;
  let seed = 1;
  let format = "png";

  if (parts.length >= 2) {
    w = parseInt(parts[0]) || 500;
    h = parseInt(parts[1]) || 500;
  }

  if (parts.length >= 3) {
    seed = parts[2] === "random"
      ? Math.floor(Math.random() * 1e9)
      : parseInt(parts[2]) || 1;
  }

  if (parts.length >= 4) {
    format = parts[3].toLowerCase();
  }

  if (!["png","jpg","webp"].includes(format)) return;

  event.respondWith(generateImage(w, h, seed, format));
});

function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

async function generateImage(w, h, seed, format) {
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");

  const img = ctx.createImageData(w, h);
  const rand = mulberry32(seed);

  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i]   = rand() * 255;
    img.data[i+1] = rand() * 255;
    img.data[i+2] = rand() * 255;
    img.data[i+3] = 255;
  }

  ctx.putImageData(img, 0, 0);

  const blob = await canvas.convertToBlob({
    type: "image/" + format,
    quality: 0.92
  });

  return new Response(blob, {
    headers: {
      "Content-Type": blob.type,
      "Cache-Control": seed === "random"
        ? "no-store"
        : "public, max-age=31536000, immutable"
    }
  });
}
