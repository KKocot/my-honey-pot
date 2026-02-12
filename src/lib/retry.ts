// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Retry wrapper for async operations with exponential backoff.
 * Used by broadcast functions where the workerbee withRetry (chain-based) is not applicable.
 */
export async function with_retry<T>(
  operation: () => Promise<T>,
  max_retries: number = 3,
  delay_ms: number = 1000,
): Promise<T> {
  let last_error: Error | null = null;

  for (let attempt = 1; attempt <= max_retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      last_error = error instanceof Error ? error : new Error(String(error));

      if (attempt < max_retries) {
        const backoff_delay = delay_ms * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, backoff_delay));
      }
    }
  }

  throw last_error;
}
