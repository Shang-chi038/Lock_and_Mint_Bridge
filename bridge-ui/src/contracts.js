import { ethers } from 'ethers'

export const ADDRESSES = {
  TST:           import.meta.env.VITE_TST_ADDRESS,
  LOCK_CONTRACT: import.meta.env.VITE_LOCK_CONTRACT_ADDRESS,
  MINT_CONTRACT: import.meta.env.VITE_MINT_CONTRACT_ADDRESS,
}

const SEPOLIA_RPC = import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'
const AMOY_RPC    = import.meta.env.VITE_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'

// Read-only providers — used for polling both chains without MetaMask
export const sepoliaProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC)
export const amoyProvider    = new ethers.JsonRpcProvider(AMOY_RPC)

// Minimal ABIs
export const TST_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

export const LOCK_ABI = [
  'function lock(uint256 amount) external',
  'function refund(uint256 nonce) external',
  'function nextNonce() view returns (uint256)',
  'function processed(uint256 nonce) view returns (bool)',
  'function depositor(uint256 nonce) view returns (address)',
]

export const MINT_ABI = [
  'function processed(uint256 nonce) view returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

// Read-only contract instances (for polling)
export const tstReadOnly  = ADDRESSES.TST           ? new ethers.Contract(ADDRESSES.TST,           TST_ABI,  sepoliaProvider) : null
export const lockReadOnly = ADDRESSES.LOCK_CONTRACT ? new ethers.Contract(ADDRESSES.LOCK_CONTRACT,  LOCK_ABI, sepoliaProvider) : null
export const mintReadOnly = ADDRESSES.MINT_CONTRACT ? new ethers.Contract(ADDRESSES.MINT_CONTRACT,  MINT_ABI, amoyProvider)    : null

// Returns signer-connected contract instances for write calls
export function getSignerContracts(signer) {
  return {
    tst:  new ethers.Contract(ADDRESSES.TST,           TST_ABI,  signer),
    lock: new ethers.Contract(ADDRESSES.LOCK_CONTRACT,  LOCK_ABI, signer),
  }
}
