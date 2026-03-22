import { AssetCard } from "./components/AssetCard";

const NODE_URL = process.env.ERGO_NODE_URL || "http://96.255.150.220:9053";
const COMPANION_NFT_ID = "3182674f07dbb98d696d38eda53e63eb3bf5fe570f71dee85eb954d6cf903bba";
const ORACLE_DECIMAL = 1_000_000;

const CATEGORIES = [
  {
    name: "Crypto",
    subtitle: "Physical Delivery Available",
    assets: [
      { name: "ETH", slug: "eth", index: 0, physical: true },
      { name: "BTC", slug: "btc", index: 1, physical: true },
      { name: "BNB", slug: "bnb", index: 2, physical: true },
      { name: "DOGE", slug: "doge", index: 3, physical: true },
      { name: "ADA", slug: "ada", index: 4, physical: true },
      { name: "ERG", slug: "erg", index: 17, physical: true },
    ],
  },
  {
    name: "Commodities & Metals",
    subtitle: "Cash Settlement",
    assets: [
      { name: "Gold", slug: "gold", index: 18, physical: true },
      { name: "Brent", slug: "brent", index: 13, physical: false },
      { name: "WTI", slug: "wti", index: 14, physical: false },
      { name: "NatGas", slug: "natgas", index: 15, physical: false },
      { name: "Lithium", slug: "lithium", index: 16, physical: false },
    ],
  },
  {
    name: "Indices",
    subtitle: "Cash Settlement",
    assets: [
      { name: "S&P 500", slug: "spx", index: 9, physical: false },
      { name: "DJI", slug: "dji", index: 10, physical: false },
    ],
  },
];

/**
 * Decode Ergo node register hex to extract Coll[Long] values.
 * Register format: serialized sigma value. For Coll[Long] (type 0x11):
 *   0x11 <length-VLQ> <values as signed VLQ longs>
 *
 * We use a simplified approach: try the node's /script/p2sAddress endpoint
 * or manually parse. For now, use the explorer API which returns parsed values.
 */
async function fetchSpotPrices(): Promise<Map<number, number>> {
  const prices = new Map<number, number>();

  try {
    // Fetch companion box via explorer-compatible API
    const res = await fetch(
      `${NODE_URL}/blockchain/box/unspent/byTokenId/${COMPANION_NFT_ID}?offset=0&limit=1`,
      { next: { revalidate: 60 } } // cache for 60s
    );

    if (!res.ok) return prices;
    const boxes = await res.json();
    if (!boxes || boxes.length === 0) return prices;

    const box = boxes[0];

    // R8 is the 5th register (R4=first). The node API returns registers
    // under additionalRegisters as {R4: "hex", R5: "hex", ...}
    // For the companion box, R8 contains spot prices as Coll[Long]
    // The node returns the raw sigma-serialized hex.
    //
    // Parsing sigma serialization for Coll[Long]:
    // Type byte 0x11 = Coll[Long], then VLQ length, then VLQ-encoded signed longs
    const r8hex = box.additionalRegisters?.R8;
    if (!r8hex) return prices;

    const bytes = hexToBytes(r8hex);
    const parsed = parseCollLong(bytes);
    if (parsed) {
      for (let i = 0; i < parsed.length && i < 21; i++) {
        if (parsed[i] > 0) {
          prices.set(i, parsed[i] / ORACLE_DECIMAL);
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch oracle prices:", err);
  }

  return prices;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Parse a sigma-serialized Coll[Long] value.
 * Format: type_byte(0x11) + VLQ_count + VLQ_encoded_longs
 */
function parseCollLong(bytes: Uint8Array): number[] | null {
  let offset = 0;

  // Type byte: 0x11 = Coll[Long]
  if (bytes[offset] !== 0x11) return null;
  offset++;

  // Read VLQ count
  const [count, newOffset] = readVLQ(bytes, offset);
  offset = newOffset;

  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    const [val, nextOffset] = readSignedVLQ(bytes, offset);
    offset = nextOffset;
    values.push(val);
  }

  return values;
}

/** Read unsigned VLQ (variable-length quantity) */
function readVLQ(bytes: Uint8Array, offset: number): [number, number] {
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

/** Read signed VLQ (ZigZag encoded) */
function readSignedVLQ(bytes: Uint8Array, offset: number): [number, number] {
  const [raw, newOffset] = readVLQ(bytes, offset);
  // ZigZag decode: (raw >>> 1) ^ -(raw & 1)
  const value = (raw >>> 1) ^ -(raw & 1);
  return [value, newOffset];
}

export default async function HomePage() {
  const spotPrices = await fetchSpotPrices();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">P2P Options</h1>
        <p className="text-[#94a3b8]">
          Decentralized options trading on Ergo. Pick an asset to see available options.
        </p>
      </div>

      {CATEGORIES.map((category) => (
        <section key={category.name}>
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-lg font-semibold">{category.name}</h2>
            <span className="text-sm text-[#94a3b8]">{category.subtitle}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {category.assets.map((asset) => (
              <AssetCard
                key={asset.index}
                name={asset.name}
                slug={asset.slug}
                price={spotPrices.get(asset.index)}
                hasPhysical={asset.physical}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
