/**
 * Bot configuration — loaded from environment variables.
 *
 * PERMISSIONLESS: Anyone can run this bot. Only needs a wallet
 * with small ERG balance for miner fees. No writer keys required.
 */

export const config = {
  /** Ergo node URL — local node preferred for bot operators */
  nodeUrl: process.env.ERGO_NODE || 'http://localhost:9053',

  /** Poll interval in milliseconds */
  pollInterval: Number(process.env.POLL_INTERVAL || 30_000),

  /** Blocks before retrying stuck delivery */
  stuckDeliveryBlocks: Number(process.env.STUCK_DELIVERY_BLOCKS || 2),

  /** Max delivery retries before alerting */
  maxDeliveryRetries: Number(process.env.MAX_DELIVERY_RETRIES || 3),

  /** Auto-close expired reserves */
  autoCloseExpired: process.env.AUTO_CLOSE_EXPIRED !== 'false',

  /** Blocks before auto-minting a definition box */
  stuckMintBlocks: Number(process.env.STUCK_MINT_BLOCKS || 1),

  /** Max mint retries before alerting */
  maxMintRetries: Number(process.env.MAX_MINT_RETRIES || 3),

  /** Alert blocks for stuck definition boxes (legacy, used if mint keeps failing) */
  stuckDefinitionBlocks: Number(process.env.STUCK_DEFINITION_BLOCKS || 10),

  /** Contract ErgoTrees to monitor (comma-separated hex, or use CONTRACT_ADDRESSES for legacy address format) */
  contractErgoTrees: (process.env.CONTRACT_ERGOTREES || process.env.CONTRACT_ADDRESSES || '').split(',').filter(Boolean),

  /** Exercise windows per contract (comma-separated, same order) */
  exerciseWindows: (process.env.EXERCISE_WINDOWS || '720').split(',').map(Number),

  /** SQLite database path */
  dbPath: process.env.DB_PATH || './scanner-state.db',

  /** Health check port */
  healthPort: Number(process.env.HEALTH_PORT || 8090),
};
