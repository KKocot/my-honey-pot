// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Base error class for blog-logic operations
 */
export class WorkerBeeError extends Error {
  public constructor(message: string, public readonly originator?: Error | unknown) {
    super(message);
  }
}
