/**
 * Sigma serialization parsing for register data.
 *
 * Extracts R7 (Coll[Byte] = creation box ID) and R8 (Coll[Long] = option params)
 * from hex-encoded sigma-serialized register values returned by the node API.
 */

/**
 * Parse a sigma-serialized Coll[Byte] register value.
 * Format: type_byte(0x0e) + VLQ_length + raw_bytes
 * Returns hex string of the byte array contents.
 */
export function parseCollByte(hex: string): string | undefined {
  const bytes = hexToBytes(hex);
  let offset = 0;

  // Type byte: 0x0e = Coll[Byte]
  if (bytes[offset] !== 0x0e) return undefined;
  offset++;

  // Read VLQ length
  const [length, nextOffset] = readVLQNumber(bytes, offset);
  offset = nextOffset;

  // Extract raw bytes and convert to hex
  const raw = bytes.slice(offset, offset + length);
  return bytesToHex(raw);
}

/**
 * Parse a sigma-serialized Coll[Long] register value.
 * Format: type_byte(0x11) + VLQ_count + ZigZag-VLQ-encoded longs
 * Returns array of bigint values.
 */
export function parseCollLong(hex: string): bigint[] | undefined {
  const bytes = hexToBytes(hex);
  let offset = 0;

  // Type byte: 0x11 = Coll[Long]
  if (bytes[offset] !== 0x11) return undefined;
  offset++;

  // Read VLQ count
  const [count, countOffset] = readVLQNumber(bytes, offset);
  offset = countOffset;

  const values: bigint[] = [];
  for (let i = 0; i < count; i++) {
    const [val, nextOffset] = readSignedVLQBigInt(bytes, offset);
    offset = nextOffset;
    values.push(val);
  }

  return values;
}

/**
 * Parse a sigma-serialized Coll[Coll[Byte]] register value.
 * Format: type_byte(0x1a) + VLQ_outer_count + (VLQ_inner_length + raw_bytes)*
 * Returns array of Uint8Array.
 */
export function parseCollCollByte(hex: string): Uint8Array[] | undefined {
  const bytes = hexToBytes(hex);
  let offset = 0;

  // Type byte: 0x1a = Coll[Coll[Byte]]
  if (bytes[offset] !== 0x1a) return undefined;
  offset++;

  // Read outer count
  const [outerCount, outerOffset] = readVLQNumber(bytes, offset);
  offset = outerOffset;

  const results: Uint8Array[] = [];
  for (let i = 0; i < outerCount; i++) {
    const [innerLen, innerOffset] = readVLQNumber(bytes, offset);
    offset = innerOffset;
    results.push(bytes.slice(offset, offset + innerLen));
    offset += innerLen;
  }

  return results;
}

// --- Internal helpers ---

function readVLQNumber(bytes: Uint8Array, offset: number): [number, number] {
  let result = 0;
  let shift = 0;
  while (offset < bytes.length) {
    const b = bytes[offset++];
    result |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  return [result, offset];
}

function readVLQBigInt(bytes: Uint8Array, offset: number): [bigint, number] {
  let result = 0n;
  let shift = 0n;
  while (offset < bytes.length) {
    const b = BigInt(bytes[offset++]);
    result |= (b & 0x7fn) << shift;
    if ((b & 0x80n) === 0n) break;
    shift += 7n;
  }
  return [result, offset];
}

function readSignedVLQBigInt(bytes: Uint8Array, offset: number): [bigint, number] {
  const [raw, newOffset] = readVLQBigInt(bytes, offset);
  // ZigZag decode: (raw >> 1) ^ -(raw & 1)
  const value = (raw >> 1n) ^ -(raw & 1n);
  return [value, newOffset];
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
