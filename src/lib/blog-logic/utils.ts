import type { IPagination, IGlobalProperties } from "./interfaces";

export const paginateData = <T>(data: T[], pagination: IPagination): T[] => {
  const {page, pageSize} = pagination
  const startIndex = (page - 1) * pageSize;
  return data.slice(startIndex, startIndex + pageSize);
}

// ============================================================================
// VESTS/HP Conversion Utilities
// ============================================================================

/** Asset object format from database_api */
interface AssetObject {
  amount: string;
  precision: number;
  nai: string;
}

/** Type for asset values that can be string or object format */
type AssetValue = string | AssetObject;

/**
 * Parse VESTS amount to number
 * Handles both string format "123456.789012 VESTS" and asset object format
 */
export function parseVests(vests: string | AssetObject): number {
  if (typeof vests === "string") {
    return parseFloat(vests.replace(" VESTS", ""));
  }
  // Asset object format: { amount: "123456789012", precision: 6, nai: "..." }
  return parseInt(vests.amount) / Math.pow(10, vests.precision);
}

/**
 * Parse HIVE amount to number
 * Handles both string format "123.456 HIVE" and asset object format
 */
export function parseHive(hive: string | AssetObject): number {
  if (typeof hive === "string") {
    return parseFloat(hive.replace(" HIVE", ""));
  }
  // Asset object format: { amount: "123456", precision: 3, nai: "..." }
  return parseInt(hive.amount) / Math.pow(10, hive.precision);
}

/**
 * Parse balance amount (HIVE or HBD)
 * Handles both string format "123.456 HIVE" and asset object format
 */
export function parseBalance(balance: string | AssetObject): number {
  if (typeof balance === "string") {
    return parseFloat(balance.replace(/\s*(HIVE|HBD|VESTS)$/i, ""));
  }
  return parseInt(balance.amount) / Math.pow(10, balance.precision);
}

/**
 * Format Hive amount string (e.g., "123.456 HIVE" -> "123.456")
 */
export function formatHiveAmount(amount: string): string {
  return amount.replace(/\s*(HIVE|HBD|VESTS)$/i, "");
}

/**
 * Convert VESTS to HP (Hive Power) using dynamic global properties
 * Formula: HP = VESTS * (total_vesting_fund_hive / total_vesting_shares)
 *
 * @param vests - VESTS amount (as string, number, or asset object)
 * @param globalProps - Global properties with totalVestingFundHive and totalVestingShares
 */
export function convertVestsToHP(
  vests: AssetValue | number,
  globalProps: IGlobalProperties
): number {
  const vestsNum = typeof vests === "number" ? vests : parseVests(vests);
  const fundHive = parseHive(globalProps.totalVestingFundHive);
  const totalShares = parseVests(globalProps.totalVestingShares);

  if (totalShares === 0) return 0;

  return vestsNum * (fundHive / totalShares);
}

/**
 * Calculate effective HP for a user (own HP + received - delegated)
 */
export function calculateEffectiveHP(
  vestingShares: AssetValue,
  delegatedVestingShares: AssetValue,
  receivedVestingShares: AssetValue,
  globalProps: IGlobalProperties
): number {
  const own = parseVests(vestingShares);
  const delegated = parseVests(delegatedVestingShares);
  const received = parseVests(receivedVestingShares);

  const effectiveVests = own - delegated + received;

  return convertVestsToHP(effectiveVests, globalProps);
}
