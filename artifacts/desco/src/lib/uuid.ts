// Safe UUID generator that works in non-secure contexts (HTTP).
// crypto.randomUUID() is only available in secure contexts (HTTPS or localhost).
// On HTTP (e.g. before HTTPS cert provisions), it throws TypeError.
// This fallback ensures registration works regardless of protocol.

export function safeUUID(): string {
  // Try the native API first (fastest, most random).
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // Falls through to manual implementation if secure context is missing.
    }
  }

  // Manual RFC4122 v4 UUID using crypto.getRandomValues if available,
  // otherwise Math.random (less random but still works everywhere).
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  // Set version (4) and variant (10xx) bits per RFC 4122.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}
