/**
 * Ergo Options Scanner Bot — Entry Point
 *
 * PERMISSIONLESS: Anyone can run this bot.
 * - Auto-retries stuck deliveries (MINTED_UNDELIVERED boxes)
 * - Auto-closes expired reserves (returns collateral to writer)
 * - Only needs a wallet with small ERG balance for miner fees
 *
 * Usage: ERGO_NODE=http://localhost:9053 CONTRACT_ADDRESSES=addr1,addr2 npm start
 */
import http from 'node:http';
import { initDb } from './state.js';
import { startPolling } from './poller.js';
import { config } from './config.js';

// Initialize database
initDb();

// Start scanner
startPolling();

// Health check endpoint
const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    nodeUrl: config.nodeUrl,
    contracts: config.contractErgoTrees.length,
    pollInterval: config.pollInterval,
    autoCloseExpired: config.autoCloseExpired,
    uptime: process.uptime(),
  }));
});

server.listen(config.healthPort, () => {
  console.log(`[HEALTH] Listening on :${config.healthPort}/health`);
});
