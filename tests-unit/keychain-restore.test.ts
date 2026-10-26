// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ext = vi.hoisted(() => ({ installed: false }));

// KeychainLogin.tsx is Solid JSX (no Solid transform in vitest); mirror its 100 ms / 1.5 s polling
vi.mock("../src/components/auth/KeychainLogin", () => ({
  has_keychain: () => ext.installed,
  wait_for_keychain: async (timeout_ms = 1_500) => {
    const deadline = Date.now() + timeout_ms;
    while (!ext.installed) {
      if (Date.now() >= deadline) return false;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return true;
  },
}));

type AuthStore = typeof import("../src/components/auth/auth-store");

const TIMEOUT_MS = 20 * 60 * 1000;

function make_storage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

async function load_store(): Promise<AuthStore> {
  vi.resetModules();
  return import("../src/components/auth/auth-store");
}

function persist_keychain(username = "bob", expires_at = Date.now() + TIMEOUT_MS) {
  localStorage.setItem("mhp_username", username);
  localStorage.setItem("mhp_login_type", "keychain");
  localStorage.setItem("mhp_key_type", "posting");
  localStorage.setItem("mhp_session_expires_at", String(expires_at));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("window", { addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal("localStorage", make_storage());
  vi.stubGlobal("sessionStorage", make_storage());
  ext.installed = false;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("keychain session restore", () => {
  it("restores the session when the extension appears after 500 ms", async () => {
    persist_keychain();
    const store = await load_store();

    const restoring = store.restore_session();
    await vi.advanceTimersByTimeAsync(500);
    ext.installed = true;
    await vi.advanceTimersByTimeAsync(200);
    await restoring;

    expect(store.isAuthenticated()).toBe(true);
    expect(store.currentUser()?.username).toBe("bob");
    expect(localStorage.getItem("mhp_username")).toBe("bob");
  });

  it("clears the session when the extension never appears", async () => {
    persist_keychain();
    const store = await load_store();

    const restoring = store.restore_session();
    await vi.advanceTimersByTimeAsync(5_000);
    await restoring;

    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem("mhp_username")).toBeNull();
  });

  it("clears an expired session without waiting for the extension", async () => {
    persist_keychain("bob", Date.now() - 1);
    const store = await load_store();

    await store.restore_session();

    expect(vi.getTimerCount()).toBe(0);
    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem("mhp_username")).toBeNull();
  });

  it("does not override a logout made while waiting for the extension", async () => {
    persist_keychain();
    const store = await load_store();

    const restoring = store.restore_session();
    await vi.advanceTimersByTimeAsync(200);
    store.logout();
    ext.installed = true;
    await vi.advanceTimersByTimeAsync(200);
    await restoring;

    expect(store.isAuthenticated()).toBe(false);
  });

  it("does not override a login made while waiting for the extension", async () => {
    persist_keychain("bob");
    const store = await load_store();

    const restoring = store.restore_session();
    await vi.advanceTimersByTimeAsync(200);
    store.login({
      username: "carol",
      privateKey: "__KEYCHAIN_MANAGED__",
      keyType: "posting",
      loginType: "keychain",
    });
    await vi.advanceTimersByTimeAsync(5_000);
    await restoring;

    expect(store.currentUser()?.username).toBe("carol");
    expect(localStorage.getItem("mhp_username")).toBe("carol");
  });
});
