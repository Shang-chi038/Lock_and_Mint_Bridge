const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// ── Config ────────────────────────────────────────────────────────────────────
const {
  SEPOLIA_RPC_URL,
  AMOY_RPC_URL,
  PRIVATE_KEY,
  LOCK_CONTRACT_ADDRESS,
  MINT_CONTRACT_ADDRESS,
} = process.env;

const PENDING_FILE = path.join(__dirname, "pending.json");
const RETRY_INTERVAL_MS = 30_000; // retry failed mints every 30s

// ── Minimal ABIs (only what the relayer needs) ────────────────────────────────
const LOCK_ABI = [
  "event Locked(address indexed sender, uint256 amount, uint256 nonce)",
];
const MINT_ABI = [
  "function mint(address recipient, uint256 amount, uint256 nonce) external",
  "function processed(uint256 nonce) view returns (bool)",
];

// ── Persistence ───────────────────────────────────────────────────────────────
function loadPending() {
  try {
    return JSON.parse(fs.readFileSync(PENDING_FILE, "utf8"));
  } catch {
    return [];
  }
}

function savePending(list) {
  fs.writeFileSync(PENDING_FILE, JSON.stringify(list, null, 2));
}

function addPending(entry) {
  const list = loadPending();
  if (!list.find((e) => e.nonce === entry.nonce)) {
    list.push(entry);
    savePending(list);
    console.log(`[pending] saved nonce ${entry.nonce}`);
  }
}

function removePending(nonce) {
  const list = loadPending().filter((e) => e.nonce !== nonce);
  savePending(list);
}

// ── Core: attempt one mint ────────────────────────────────────────────────────
async function tryMint(mintContract, entry) {
  const { sender, amount, nonce } = entry;
  console.log(`[mint] nonce=${nonce} recipient=${sender} amount=${amount}`);

  try {
    // Skip if already minted (idempotency guard)
    const alreadyDone = await mintContract.processed(nonce);
    if (alreadyDone) {
      console.log(`[mint] nonce=${nonce} already processed — skipping`);
      removePending(nonce);
      return;
    }

    const tx = await mintContract.mint(sender, amount, nonce);
    console.log(`[mint] tx sent: ${tx.hash}`);
    await tx.wait();
    console.log(`[mint] nonce=${nonce} confirmed`);
    removePending(nonce);
  } catch (err) {
    console.error(`[mint] nonce=${nonce} failed — will retry: ${err.message}`);
  }
}

// ── Retry loop ────────────────────────────────────────────────────────────────
async function retryPending(mintContract) {
  const list = loadPending();
  if (list.length === 0) return;
  console.log(`[retry] ${list.length} pending nonce(s)`);
  for (const entry of list) {
    await tryMint(mintContract, entry);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!SEPOLIA_RPC_URL || !AMOY_RPC_URL || !PRIVATE_KEY) {
    console.error("Missing env vars: SEPOLIA_RPC_URL, AMOY_RPC_URL, PRIVATE_KEY");
    process.exit(1);
  }
  if (!LOCK_CONTRACT_ADDRESS || !MINT_CONTRACT_ADDRESS) {
    console.error("Missing env vars: LOCK_CONTRACT_ADDRESS, MINT_CONTRACT_ADDRESS");
    console.error("Deploy contracts first, then set env vars");
    process.exit(1);
  }

  const sepoliaProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const amoyProvider    = new ethers.JsonRpcProvider(AMOY_RPC_URL);
  const amoyWallet      = new ethers.Wallet(PRIVATE_KEY, amoyProvider);

  const lockContract = new ethers.Contract(LOCK_CONTRACT_ADDRESS, LOCK_ABI, sepoliaProvider);
  const mintContract = new ethers.Contract(MINT_CONTRACT_ADDRESS, MINT_ABI, amoyWallet);

  console.log(`[relayer] started`);
  console.log(`  LockContract  (Sepolia): ${LOCK_CONTRACT_ADDRESS}`);
  console.log(`  MintContract  (Amoy):    ${MINT_CONTRACT_ADDRESS}`);
  console.log(`  Relayer wallet:          ${amoyWallet.address}`);

  // Drain any leftover pending from a previous run
  await retryPending(mintContract);

  // Listen for new Locked events
  lockContract.on("Locked", async (sender, amount, nonce, event) => {
    console.log(`\n[event] Locked — sender=${sender} amount=${amount} nonce=${nonce}`);
    const entry = { sender, amount: amount.toString(), nonce: Number(nonce) };
    addPending(entry);
    await tryMint(mintContract, entry);
  });

  console.log(`[relayer] listening for Locked events on Sepolia...`);

  // Periodic retry for anything that failed
  setInterval(() => retryPending(mintContract), RETRY_INTERVAL_MS);
}

main().catch((err) => {
  console.error("[relayer] fatal:", err);
  process.exit(1);
});

