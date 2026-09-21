// Crockford base32 ULID-like identifier.
// Monotonic within a millisecond; sortable; 26 chars.
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

let lastTime = 0;
let lastRandom = new Uint8Array(10);

function encodeTime(ms) {
  let out = "";
  for (let i = 9; i >= 0; i--) {
    out = ENCODING[ms % 32] + out;
    ms = Math.floor(ms / 32);
  }
  return out;
}

function encodeRandom(bytes) {
  let out = "";
  // 10 bytes -> 16 chars (128 bits, we use all 10 bytes)
  let bits = 0;
  let value = 0;
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ENCODING[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ENCODING[(value << (5 - bits)) & 31];
  return out;
}

export function ulid() {
  const now = Date.now();
  if (now === lastTime) {
    // increment lastRandom as a big-endian integer
    for (let i = lastRandom.length - 1; i >= 0; i--) {
      if (lastRandom[i] < 255) { lastRandom[i]++; break; }
      lastRandom[i] = 0;
    }
  } else {
    lastTime = now;
    crypto.getRandomValues(lastRandom);
  }
  return encodeTime(now) + encodeRandom(lastRandom);
}

export function shortId(prefix) {
  return (prefix ? prefix + "_" : "") + ulid().slice(-10);
}
