// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import type { IWaxBaseInterface, NaiAsset } from "@hiveio/wax";
import type { IPagination } from "./interfaces";

export const paginateData = <T>(data: T[], pagination: IPagination): T[] => {
  const {page, pageSize} = pagination
  const startIndex = (page - 1) * pageSize;
  return data.slice(startIndex, startIndex + pageSize);
}

// ============================================================================
// Wax-based Asset Utilities (require chain instance)
// ============================================================================

/**
 * Parse a NaiAsset to its numeric value using Wax's getAsset method.
 *
 * @param chain - Wax chain instance
 * @param asset - NaiAsset to parse
 * @returns Numeric value of the asset
 *
 * @example
 * const value = parseAssetWithChain(chain, account.balance); // 123.456
 */
export function parseAssetWithChain(chain: IWaxBaseInterface, asset: NaiAsset): number {
  const { amount } = chain.getAsset(asset);
  return parseFloat(amount);
}

/**
 * Format a NaiAsset to a display string using Wax's formatter.
 *
 * @param chain - Wax chain instance
 * @param asset - NaiAsset to format
 * @returns Formatted string like "123.456 HIVE"
 *
 * @example
 * const str = formatAsset(chain, account.balance); // "123.456 HIVE"
 */
export function formatAsset(chain: IWaxBaseInterface, asset: NaiAsset): string {
  return chain.formatter.format(asset);
}

/**
 * Get asset amount as string without symbol using Wax's getAsset method.
 *
 * @param chain - Wax chain instance
 * @param asset - NaiAsset to parse
 * @returns Amount string like "123.456"
 *
 * @example
 * const amount = getAssetAmount(chain, account.balance); // "123.456"
 */
export function getAssetAmount(chain: IWaxBaseInterface, asset: NaiAsset): string {
  return chain.getAsset(asset).amount;
}

/**
 * Get asset symbol using Wax's getAsset method.
 *
 * @param chain - Wax chain instance
 * @param asset - NaiAsset to parse
 * @returns Symbol string like "HIVE"
 */
export function getAssetSymbol(chain: IWaxBaseInterface, asset: NaiAsset): string {
  return chain.getAsset(asset).symbol;
}

/**
 * Convert VESTS to HP using Wax's vestsToHp method.
 * Returns the HP as a NaiAsset.
 *
 * @param chain - Wax chain instance
 * @param vests - VESTS NaiAsset
 * @param totalVestingFundHive - From global properties
 * @param totalVestingShares - From global properties
 * @returns HP as NaiAsset
 */
export function vestsToHpAsset(
  chain: IWaxBaseInterface,
  vests: NaiAsset,
  totalVestingFundHive: NaiAsset,
  totalVestingShares: NaiAsset
): NaiAsset {
  return chain.vestsToHp(vests, totalVestingFundHive, totalVestingShares);
}

/**
 * Convert VESTS to HP and return as number using Wax's vestsToHp method.
 *
 * @param chain - Wax chain instance
 * @param vests - VESTS NaiAsset
 * @param totalVestingFundHive - From global properties
 * @param totalVestingShares - From global properties
 * @returns HP as number
 */
export function vestsToHpNumber(
  chain: IWaxBaseInterface,
  vests: NaiAsset,
  totalVestingFundHive: NaiAsset,
  totalVestingShares: NaiAsset
): number {
  const hpAsset = chain.vestsToHp(vests, totalVestingFundHive, totalVestingShares);
  return parseFloat(chain.getAsset(hpAsset).amount);
}

/**
 * Calculate effective HP (own + received - delegated) using Wax methods.
 *
 * @param chain - Wax chain instance
 * @param vestingShares - User's own vesting shares
 * @param delegatedVestingShares - Shares delegated to others
 * @param receivedVestingShares - Shares received from others
 * @param totalVestingFundHive - From global properties
 * @param totalVestingShares - From global properties
 * @returns Effective HP as NaiAsset
 */
export function calculateEffectiveHpAsset(
  chain: IWaxBaseInterface,
  vestingShares: NaiAsset,
  delegatedVestingShares: NaiAsset,
  receivedVestingShares: NaiAsset,
  totalVestingFundHive: NaiAsset,
  totalVestingShares: NaiAsset
): NaiAsset {
  const ownHp = chain.vestsToHp(vestingShares, totalVestingFundHive, totalVestingShares);
  const delegatedHp = chain.vestsToHp(delegatedVestingShares, totalVestingFundHive, totalVestingShares);
  const receivedHp = chain.vestsToHp(receivedVestingShares, totalVestingFundHive, totalVestingShares);

  // own - delegated + received (amounts are in satoshis as strings)
  const effectiveAmount = BigInt(ownHp.amount) - BigInt(delegatedHp.amount) + BigInt(receivedHp.amount);
  return { ...ownHp, amount: effectiveAmount.toString() };
}

/**
 * Calculate effective HP and return as number.
 */
export function calculateEffectiveHpNumber(
  chain: IWaxBaseInterface,
  vestingShares: NaiAsset,
  delegatedVestingShares: NaiAsset,
  receivedVestingShares: NaiAsset,
  totalVestingFundHive: NaiAsset,
  totalVestingShares: NaiAsset
): number {
  const hpAsset = calculateEffectiveHpAsset(
    chain, vestingShares, delegatedVestingShares, receivedVestingShares,
    totalVestingFundHive, totalVestingShares
  );
  return parseFloat(chain.getAsset(hpAsset).amount);
}

// ============================================================================
// Standalone Asset Utilities (no chain required)
// ============================================================================

/**
 * Parse a NaiAsset to its numeric value.
 * Use this when you don't have access to a chain instance.
 *
 * @param asset - NaiAsset object
 * @returns Numeric value of the asset
 */
export function parseNaiAsset(asset: NaiAsset): number {
  return parseInt(asset.amount) / Math.pow(10, asset.precision);
}

/**
 * Parse a formatted asset string to number.
 * Use this for strings already formatted by Wax (e.g., "123.456 HIVE").
 *
 * @param formattedAsset - Formatted string like "123.456 HIVE"
 * @returns Numeric value
 */
export function parseFormattedAsset(formattedAsset: string): number {
  return parseFloat(formattedAsset.replace(/\s*(HIVE|HBD|VESTS)$/i, ""));
}

/**
 * Strip currency suffix from a formatted asset string.
 *
 * @example
 * stripAssetSuffix("123.456 HIVE") // returns "123.456"
 */
export function stripAssetSuffix(amount: string): string {
  return amount.replace(/\s*(HIVE|HBD|VESTS)$/i, "");
}

/**
 * Convert VESTS to HP (Hive Power) using dynamic global properties.
 * Standalone version that works without a chain instance.
 *
 * Formula: HP = VESTS * (total_vesting_fund_hive / total_vesting_shares)
 *
 * @param vests - VESTS amount (as NaiAsset or number)
 * @param globalProps - Global properties with totalVestingFundHive and totalVestingShares
 */
export function convertVestsToHP(
  vests: NaiAsset | number,
  globalProps: { totalVestingFundHive: NaiAsset; totalVestingShares: NaiAsset }
): number {
  const vestsNum = typeof vests === "number" ? vests : parseNaiAsset(vests);
  const fundHive = parseNaiAsset(globalProps.totalVestingFundHive);
  const totalShares = parseNaiAsset(globalProps.totalVestingShares);

  if (totalShares === 0) return 0;
  return vestsNum * (fundHive / totalShares);
}

/**
 * Calculate effective HP for a user (own HP + received - delegated).
 * Standalone version that works without a chain instance.
 *
 * @param vestingShares - User's own vesting shares
 * @param delegatedVestingShares - Shares delegated to others
 * @param receivedVestingShares - Shares received from others
 * @param globalProps - Global properties for conversion
 */
export function calculateEffectiveHP(
  vestingShares: NaiAsset,
  delegatedVestingShares: NaiAsset,
  receivedVestingShares: NaiAsset,
  globalProps: { totalVestingFundHive: NaiAsset; totalVestingShares: NaiAsset }
): number {
  const own = parseNaiAsset(vestingShares);
  const delegated = parseNaiAsset(delegatedVestingShares);
  const received = parseNaiAsset(receivedVestingShares);
  const effectiveVests = own - delegated + received;
  return convertVestsToHP(effectiveVests, globalProps);
}

// ============================================================================
// Display Formatting Utilities
// ============================================================================

/**
 * Format a large number with K/M suffix
 * @example 12500 -> "12.5K", 1234567 -> "1.2M"
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

/**
 * Format a number with fixed decimals
 * @example 12345.678 -> "12,345.678"
 */
export function formatNumber(num: number, decimals = 3): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format date to readable string
 * @example "2016-03-25T15:09:27" -> "Mar 2016"
 */
export function formatJoinDate(dateStr: string): string {
  const date = new Date(dateStr + 'Z');
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Format reputation score
 * For bridge.get_profile, reputation is already formatted as float
 */
export function formatReputation(rep: number): number {
  return Math.floor(rep);
}
