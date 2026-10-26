// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { createWaxFoundation, type ApiAuthority, type IWaxBaseInterface } from "@hiveio/wax";
import createBeekeeper, { type IBeekeeperUnlockedWallet } from "@hiveio/beekeeper";

import {
  verify_posting_signature,
  type PostingVerifierChain,
} from "../src/lib/verify-posting-signature";

const USERNAME = "alice";
const MESSAGE = "my-honey-pot login alice 1700000000000";

let wax: IWaxBaseInterface;
let wallet: IBeekeeperUnlockedWallet;
let posting_key: string;
let other_key: string;

function sign(public_key: string, message: string): string {
  const digest = createHash("sha256").update(message, "utf8").digest("hex");
  return wallet.signDigest(public_key, digest);
}

function make_chain(
  find_accounts: PostingVerifierChain["api"]["database_api"]["find_accounts"]
): PostingVerifierChain {
  return {
    getPublicKeyFromSignature: (digest, signature) => wax.getPublicKeyFromSignature(digest, signature),
    api: { database_api: { find_accounts } },
  };
}

function chain_with_posting(posting: ApiAuthority): PostingVerifierChain {
  return make_chain(async () => ({
    accounts: [{ name: USERNAME, posting } as never],
  }));
}

function single_key_posting(key: string): ApiAuthority {
  return { weight_threshold: 1, account_auths: [], key_auths: [[key, 1] as never] };
}

beforeAll(async () => {
  wax = await createWaxFoundation();
  const beekeeper = await createBeekeeper({ inMemory: true, enableLogs: false });
  const session = beekeeper.createSession("verify-posting-signature-test");
  ({ wallet } = await session.createWallet("test", "test-password", true));
  posting_key = await wallet.importKey(wax.suggestBrainKey().wifPrivateKey);
  other_key = await wallet.importKey(wax.suggestBrainKey().wifPrivateKey);
});

describe("verify_posting_signature", () => {
  it("accepts a valid signature made with a key from posting.key_auths", async () => {
    const result = await verify_posting_signature(
      { username: USERNAME, message: MESSAGE, signature: sign(posting_key, MESSAGE), public_key: posting_key },
      chain_with_posting(single_key_posting(posting_key))
    );

    expect(result).toEqual({ ok: true, public_key: posting_key });
  });

  it("accepts a posting key listed with a different address prefix (testnet)", async () => {
    const result = await verify_posting_signature(
      {
        username: USERNAME,
        message: MESSAGE,
        signature: sign(posting_key, MESSAGE),
        public_key: `TST${posting_key.slice(3)}`,
      },
      chain_with_posting(single_key_posting(`TST${posting_key.slice(3)}`))
    );

    expect(result).toEqual({ ok: true, public_key: posting_key });
  });

  it("rejects a key that is not in posting.key_auths", async () => {
    const result = await verify_posting_signature(
      { username: USERNAME, message: MESSAGE, signature: sign(other_key, MESSAGE), public_key: other_key },
      chain_with_posting(single_key_posting(posting_key))
    );

    expect(result).toEqual({ ok: false, reason: "key_not_in_posting_authority" });
  });

  it("rejects a key whose weight is below the posting weight_threshold", async () => {
    const result = await verify_posting_signature(
      { username: USERNAME, message: MESSAGE, signature: sign(posting_key, MESSAGE) },
      chain_with_posting({
        weight_threshold: 2,
        account_auths: [],
        key_auths: [[posting_key, 1] as never, [other_key, 1] as never],
      })
    );

    expect(result).toEqual({ ok: false, reason: "insufficient_key_weight" });
  });

  it("rejects a signature over a different message", async () => {
    const result = await verify_posting_signature(
      {
        username: USERNAME,
        message: MESSAGE,
        signature: sign(posting_key, "another message"),
        public_key: posting_key,
      },
      chain_with_posting(single_key_posting(posting_key))
    );

    expect(result).toEqual({ ok: false, reason: "public_key_mismatch" });
  });

  it("rejects a signature over a different message without a claimed public key", async () => {
    const result = await verify_posting_signature(
      { username: USERNAME, message: MESSAGE, signature: sign(posting_key, "another message") },
      chain_with_posting(single_key_posting(posting_key))
    );

    expect(result).toEqual({ ok: false, reason: "key_not_in_posting_authority" });
  });

  it("rejects a malformed signature", async () => {
    const result = await verify_posting_signature(
      { username: USERNAME, message: MESSAGE, signature: "deadbeef", public_key: posting_key },
      chain_with_posting(single_key_posting(posting_key))
    );

    expect(result).toEqual({ ok: false, reason: "invalid_signature" });
  });

  it("rejects an unknown account", async () => {
    const result = await verify_posting_signature(
      { username: USERNAME, message: MESSAGE, signature: sign(posting_key, MESSAGE) },
      make_chain(async () => ({ accounts: [] }))
    );

    expect(result).toEqual({ ok: false, reason: "account_not_found" });
  });

  it("rethrows network errors from the account lookup", async () => {
    const network_error = new TypeError("fetch failed");

    await expect(
      verify_posting_signature(
        { username: USERNAME, message: MESSAGE, signature: sign(posting_key, MESSAGE) },
        make_chain(async () => {
          throw network_error;
        })
      )
    ).rejects.toBe(network_error);
  });
});
