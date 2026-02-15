export function yesPrice(yesPool: number, noPool: number): number {
  const total = yesPool + noPool;
  if (total === 0) return 0.5;
  return noPool / total;
}

/** Current price of a NO share (0–1). */
export function noPrice(yesPool: number, noPool: number): number {
  const total = yesPool + noPool;
  if (total === 0) return 0.5;
  return yesPool / total;
}

/** Buy YES shares by spending `amount` cents. Returns shares received and new pool state. */
export function buyYes(yesPool: number, noPool: number, amount: number) {
  const k = yesPool * noPool;
  const newNoPool = noPool + amount;
  const newYesPool = k / newNoPool;
  const shares = yesPool - newYesPool;
  return { shares, yesPool: newYesPool, noPool: newNoPool };
}

/** Buy NO shares by spending `amount` cents. Returns shares received and new pool state. */
export function buyNo(yesPool: number, noPool: number, amount: number) {
  const k = yesPool * noPool;
  const newYesPool = yesPool + amount;
  const newNoPool = k / newYesPool;
  const shares = noPool - newNoPool;
  return { shares, yesPool: newYesPool, noPool: newNoPool };
}

/** Sell YES shares back to the pool. Returns payout in cents and new pool state. */
export function sellYes(yesPool: number, noPool: number, shares: number) {
  const k = yesPool * noPool;
  const newYesPool = yesPool + shares;
  const newNoPool = k / newYesPool;
  const payout = noPool - newNoPool;
  return { payout, yesPool: newYesPool, noPool: newNoPool };
}

/** Sell NO shares back to the pool. Returns payout in cents and new pool state. */
export function sellNo(yesPool: number, noPool: number, shares: number) {
  const k = yesPool * noPool;
  const newNoPool = noPool + shares;
  const newYesPool = k / newNoPool;
  const payout = yesPool - newYesPool;
  return { payout, yesPool: newYesPool, noPool: newNoPool };
}

/** Estimate how much it costs to buy `shares` YES shares. */
export function costToBuyYes(yesPool: number, noPool: number, shares: number): number {
  if (shares >= yesPool) return Infinity;
  const k = yesPool * noPool;
  const newYesPool = yesPool - shares;
  const newNoPool = k / newYesPool;
  return newNoPool - noPool;
}

/** Estimate how much it costs to buy `shares` NO shares. */
export function costToBuyNo(yesPool: number, noPool: number, shares: number): number {
  if (shares >= noPool) return Infinity;
  const k = yesPool * noPool;
  const newNoPool = noPool - shares;
  const newYesPool = k / newNoPool;
  return newYesPool - yesPool;
}
