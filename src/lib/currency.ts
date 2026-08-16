export const UGX_TO_USD = 3700

export function ugxToUsd(ugx: number): number {
  return ugx / UGX_TO_USD
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatUgx(amount: number): string {
  return `UGX ${amount.toLocaleString()}`
}

export function formatDualCurrency(ugx: number): string {
  const usd = ugxToUsd(ugx)
  return `${formatUgx(ugx)} / ${formatUsd(usd)}`
}
