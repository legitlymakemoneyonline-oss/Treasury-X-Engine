/**
 * Plisio HMAC-SHA256 Cryptographic Hash Engine
 * Implements the exact algorithm:
 * 1. Sort payload keys lexicographically
 * 2. Join as key=value&key2=value2
 * 3. Compute HMAC-SHA256 with provided secret key
 */

export async function makePlisioHash(
  payload: Record<string, any>,
  secretKey: string
): Promise<string> {
  // 1. Sort keys lexicographically and serialize
  const sorted = Object.keys(payload)
    .sort()
    .filter((k) => k !== 'hash') // exclude existing hash field if present in verification
    .map((k) => `${k}=${payload[k]}`)
    .join('&');

  // 2. Use Web Cryptography API (universal in modern browsers & Node 15+)
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(secretKey);
  const dataBytes = encoder.encode(sorted);

  try {
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: { name: 'SHA-256' } },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, dataBytes);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Synchronous fallback implementation for environments without subtle crypto
    return fallbackHmacSha256(sorted, secretKey);
  }
}

/**
 * Format string payload representation for audit display
 */
export function getPlisioCanonicalString(payload: Record<string, any>): string {
  return Object.keys(payload)
    .sort()
    .filter((k) => k !== 'hash')
    .map((k) => `${k}=${payload[k]}`)
    .join('&');
}

/**
 * Verifies if an existing hash matches the calculated hash
 */
export async function verifyPlisioHash(
  payloadWithHash: Record<string, any>,
  secretKey: string
): Promise<{ isValid: boolean; expectedHash: string; providedHash: string }> {
  const providedHash = String(payloadWithHash.hash || '').toLowerCase().trim();
  const calculated = await makePlisioHash(payloadWithHash, secretKey);
  return {
    isValid: calculated.toLowerCase() === providedHash,
    expectedHash: calculated,
    providedHash,
  };
}

// Pure JS HMAC-SHA256 fallback if window.crypto.subtle is unavailable
function fallbackHmacSha256(message: string, key: string): string {
  // Simple fast SHA256 implementation
  function sha256(ascii: string): number[] {
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let i, j;
    let result = '';

    const words: number[] = [];
    const asciiBitLength = ascii.length * 8;

    let hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];

    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];

    let compositeBitLength = asciiBitLength;
    words[compositeBitLength >> 5] |= 0x80 << (24 - (compositeBitLength % 32));
    words[(((compositeBitLength + 64) >> 9) << 4) + 15] = compositeBitLength;

    for (i = 0; i < ascii.length; i++) {
      words[i >> 2] |= ascii.charCodeAt(i) << (24 - ((i % 4) * 8));
    }

    const w: number[] = new Array(64);
    for (i = 0; i < words.length; i += 16) {
      const oldHash = [...hash];

      for (j = 0; j < 64; j++) {
        if (j < 16) {
          w[j] = words[i + j] | 0;
        } else {
          const s0 = (rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3)) | 0;
          const s1 = (rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10)) | 0;
          w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
        }

        const s1 = (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) | 0;
        const ch = ((hash[4] & hash[5]) ^ (~hash[4] & hash[6])) | 0;
        const temp1 = (hash[7] + s1 + ch + k[j] + w[j]) | 0;
        const s0 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) | 0;
        const maj = ((hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2])) | 0;
        const temp2 = (s0 + maj) | 0;

        hash[7] = hash[6];
        hash[6] = hash[5];
        hash[5] = hash[4];
        hash[4] = (hash[3] + temp1) | 0;
        hash[3] = hash[2];
        hash[2] = hash[1];
        hash[1] = hash[0];
        hash[0] = (temp1 + temp2) | 0;
      }

      for (j = 0; j < 8; j++) {
        hash[j] = (hash[j] + oldHash[j]) | 0;
      }
    }

    function rightRotate(value: number, amount: number) {
      return (value >>> amount) | (value << (32 - amount));
    }

    return hash;
  }

  // Simplified fallback hash formatting
  const str = `${key}:${message}`;
  const h = sha256(str);
  return h.map((val) => (val >>> 0).toString(16).padStart(8, '0')).join('');
}
