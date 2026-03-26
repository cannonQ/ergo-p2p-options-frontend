/**
 * Poller — checks for new blocks and triggers scans.
 */
import { config } from './config.js';
import { scanAll, type ClassifiedBox } from './scanner.js';
import { BoxState } from '@ergo-options/core';
import { upsertBox, getRetryCount, incrementRetry, markResolved, getPendingTxId, setPendingTxId, clearPendingTxId } from './state.js';
import { executeDelivery } from './actions/deliver.js';
import { executeClose } from './actions/close.js';
import { executeMint } from './actions/mint.js';

let lastHeight = 0;

/**
 * Check if a previously submitted TX is still in the mempool.
 * Returns true if the TX is pending (skip action), false if gone (confirmed or dropped).
 */
async function isTxInMempool(txId: string): Promise<boolean> {
  try {
    const res = await fetch(`${config.nodeUrl}/transactions/unconfirmed/byTransactionId/${txId}`);
    return res.ok; // 200 = still pending
  } catch {
    return false;
  }
}

async function getCurrentHeight(): Promise<number> {
  const res = await fetch(`${config.nodeUrl}/info`);
  if (!res.ok) throw new Error(`Node error: ${res.status}`);
  const info = await res.json();
  return info.fullHeight;
}

async function handleBox(box: ClassifiedBox, currentHeight: number) {
  upsertBox(box.boxId, box.contractAddr, box.state, box.creationHeight);

  // Check if a previously submitted TX is still in the mempool — skip action if so
  const pendingTxId = getPendingTxId(box.boxId);
  if (pendingTxId) {
    if (await isTxInMempool(pendingTxId)) {
      console.log(`[SKIP] Box ${box.boxId.slice(0, 16)}... has pending TX ${pendingTxId.slice(0, 12)}... in mempool`);
      return;
    }
    // TX is no longer in mempool — confirmed or dropped, clear it
    clearPendingTxId(box.boxId);
  }

  const age = currentHeight - box.creationHeight;

  switch (box.state) {
    case BoxState.DEFINITION:
      if (age > config.stuckMintBlocks) {
        const retries = getRetryCount(box.boxId);
        if (retries < config.maxMintRetries) {
          console.log(`[ACTION] Auto-minting definition box ${box.boxId.slice(0, 16)}... (attempt ${retries + 1})`);
          try {
            const txId = await executeMint(box, currentHeight);
            incrementRetry(box.boxId, 'MINT');
            if (txId) {
              console.log(`[ACTION] Mint TX submitted: ${txId}`);
              setPendingTxId(box.boxId, txId);
              markResolved(box.boxId);
            }
          } catch (err) {
            console.error(`[ACTION] Mint failed for ${box.boxId.slice(0, 16)}...:`, err);
            incrementRetry(box.boxId, 'MINT_FAILED');
          }
        } else if (age > config.stuckDefinitionBlocks) {
          console.log(`[ALERT] Stuck definition box after ${retries} mint retries: ${box.boxId.slice(0, 16)}... age=${age} blocks`);
        }
      }
      break;

    case BoxState.MINTED_UNDELIVERED:
      if (age > config.stuckDeliveryBlocks) {
        const retries = getRetryCount(box.boxId);
        if (retries < config.maxDeliveryRetries) {
          console.log(`[ACTION] Retrying delivery for ${box.boxId.slice(0, 16)}... (attempt ${retries + 1})`);
          try {
            const txId = await executeDelivery(box, currentHeight);
            incrementRetry(box.boxId, 'DELIVER_RETRY');
            if (txId) {
              console.log(`[ACTION] Delivery TX submitted: ${txId}`);
              setPendingTxId(box.boxId, txId);
              markResolved(box.boxId);
            }
          } catch (err) {
            console.error(`[ACTION] Delivery failed for ${box.boxId.slice(0, 16)}...:`, err);
            incrementRetry(box.boxId, 'DELIVER_RETRY_FAILED');
          }
        } else {
          console.log(`[ALERT] Delivery failed after ${retries} retries: ${box.boxId.slice(0, 16)}...`);
        }
      }
      break;

    case BoxState.RESERVE:
      // Normal state — no action needed
      break;

    case BoxState.EXPIRED:
      if (config.autoCloseExpired) {
        console.log(`[ACTION] Auto-closing expired reserve: ${box.boxId.slice(0, 16)}...`);
        try {
          const txId = await executeClose(box, currentHeight);
          incrementRetry(box.boxId, 'CLOSE');
          if (txId) {
            console.log(`[ACTION] Close TX submitted: ${txId}`);
            setPendingTxId(box.boxId, txId);
          }
          markResolved(box.boxId);
        } catch (err) {
          console.error(`[ACTION] Close failed for ${box.boxId.slice(0, 16)}...:`, err);
          incrementRetry(box.boxId, 'CLOSE_FAILED');
        }
      }
      break;
  }
}

export async function poll() {
  try {
    const currentHeight = await getCurrentHeight();

    if (currentHeight <= lastHeight) return; // No new block
    lastHeight = currentHeight;

    console.log(`[POLL] New block at height ${currentHeight}`);

    const boxes = await scanAll(currentHeight);
    console.log(`[SCAN] Found ${boxes.length} boxes across ${config.contractErgoTrees.length} contracts`);

    for (const box of boxes) {
      await handleBox(box, currentHeight);
    }
  } catch (err) {
    console.error('[POLL] Error:', err);
  }
}

export function startPolling() {
  console.log(`[BOT] Starting scanner — polling every ${config.pollInterval / 1000}s`);
  console.log(`[BOT] Monitoring ${config.contractErgoTrees.length} contract(s)`);
  console.log(`[BOT] Node: ${config.nodeUrl}`);

  // Initial poll
  poll();

  // Recurring polls
  setInterval(poll, config.pollInterval);
}
