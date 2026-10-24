/**
 * Provably Fair Cryptographic Random Number Engine
 * Generates verifiable outcomes using SHA-256 and HMAC
 */

export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateRandomSeed(length = 32): string {
  const chars = 'abcdef0123456789';
  let res = '';
  for (let i = 0; i < length; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
  }
  return res;
}

/**
 * Computes deterministic float between 0 and 1 from serverSeed + clientSeed + nonce
 */
export async function getOutcomeHash(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<{ hash: string; floatVal: number }> {
  const combined = `${serverSeed}:${clientSeed}:${nonce}`;
  const hash = await sha256(combined);

  // Take first 8 hex characters (32 bits) and divide by 2^32
  const hexPart = hash.slice(0, 8);
  const intVal = parseInt(hexPart, 16);
  const floatVal = intVal / 0xffffffff;

  return { hash, floatVal };
}

/**
 * Dice: returns roll from 0.00 to 99.99
 */
export async function rollDiceOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<{ roll: number; hash: string }> {
  const { hash, floatVal } = await getOutcomeHash(serverSeed, clientSeed, nonce);
  const roll = Math.floor(floatVal * 10000) / 100;
  return { roll, hash };
}

/**
 * Plinko: returns array of direction choices (0 = left, 1 = right) for rows
 */
export async function rollPlinkoOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  rows: number
): Promise<{ path: number[]; finalSlot: number; hash: string }> {
  const combined = `${serverSeed}:${clientSeed}:${nonce}:plinko`;
  const hash = await sha256(combined);

  const path: number[] = [];
  let rightMoves = 0;

  for (let i = 0; i < rows; i++) {
    const char = hash.charCodeAt(i % hash.length);
    const dir = char % 2; // 0 = left, 1 = right
    path.push(dir);
    if (dir === 1) rightMoves++;
  }

  return { path, finalSlot: rightMoves, hash };
}

/**
 * Keno: selects 10 distinct winning numbers from 1 to 40
 */
export async function rollKenoOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count = 10,
  maxNumber = 40
): Promise<{ winningNumbers: number[]; hash: string }> {
  const combined = `${serverSeed}:${clientSeed}:${nonce}:keno`;
  const hash = await sha256(combined);

  const pool = Array.from({ length: maxNumber }, (_, i) => i + 1);
  const winning: number[] = [];

  for (let i = 0; i < count; i++) {
    const hexSlice = hash.slice((i * 4) % (hash.length - 4), ((i * 4) % (hash.length - 4)) + 4);
    const intVal = parseInt(hexSlice, 16);
    const pickIndex = intVal % pool.length;
    winning.push(pool.splice(pickIndex, 1)[0]);
  }

  winning.sort((a, b) => a - b);
  return { winningNumbers: winning, hash };
}

/**
 * European Roulette: returns pocket 0 to 36
 */
export async function rollRouletteOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<{ pocket: number; color: 'RED' | 'BLACK' | 'GREEN'; hash: string }> {
  const { hash, floatVal } = await getOutcomeHash(serverSeed, clientSeed, nonce);
  const pocket = Math.floor(floatVal * 37); // 0 to 36

  const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

  let color: 'RED' | 'BLACK' | 'GREEN' = 'GREEN';
  if (pocket !== 0) {
    color = RED_NUMBERS.includes(pocket) ? 'RED' : 'BLACK';
  }

  return { pocket, color, hash };
}
