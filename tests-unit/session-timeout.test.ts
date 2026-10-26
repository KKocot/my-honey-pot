// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hb = vi.hoisted(() => ({
  options: [] as Array<Record<string, unknown>>,
  users: [] as Array<{ username: string; unlocked: boolean }>,
  logout_calls: [] as string[],
  session_end_cb: null as null | (() => Promise<void>),
  keychain: true,
  users_delay_ms: 0,
}));

vi.mock("@hiveio/hb-auth", () => {
  class FakeClient {
    constructor(options: Record<string, unknown>) {
      hb.options.push(options);
    }
    async initialize() {
      return this;
    }
    async getRegisteredUsers() {
      if (hb.users_delay_ms > 0) {
        await new Promise((resolve) => setTimeout(resolve, hb.users_delay_ms));
      }
      return hb.users.map((u) => ({ ...u }));
    }
    async logout(username: string) {
      hb.logout_calls.push(username);
      const user = hb.users.find((u) => u.username === username);
      if (user) user.unlocked = false;
      await hb.session_end_cb?.();
    }
    async setSessionEndCallback(cb: () => Promise<void>) {
      hb.session_end_cb = cb;
    }
  }
  return { OnlineClient: FakeClient, OfflineClient: FakeClient };
});

vi.mock("../src/components/auth/KeychainLogin", () => ({
  has_keychain: () => hb.keychain,
  wait_for_keychain: async () => hb.keychain,
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

function hbauth_user(username = "alice") {
  return {
    username,
    privateKey: "__HBAUTH_MANAGED__",
    keyType: "posting" as const,
    loginType: "hbauth" as const,
  };
}

function keychain_user(username = "bob") {
  return {
    username,
    privateKey: "__KEYCHAIN_MANAGED__",
    keyType: "posting" as const,
    loginType: "keychain" as const,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("window", { addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal("localStorage", make_storage());
  vi.stubGlobal("sessionStorage", make_storage());
  vi.spyOn(console, "info").mockImplementation(() => {});
  hb.options = [];
  hb.users = [];
  hb.logout_calls = [];
  hb.session_end_cb = null;
  hb.keychain = true;
  hb.users_delay_ms = 0;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("session timeout constant", () => {
  it("app session lasts 20 minutes", async () => {
    const store = await load_store();
    expect(store.SESSION_TIMEOUT_MS).toBe(TIMEOUT_MS);
  });

  it("HB-Auth client gets the same timeout, in seconds", async () => {
    vi.resetModules();
    const service = await import("../src/lib/hbauth-service");
    await service.getOnlineClient();
    expect(service.HBAUTH_SESSION_TIMEOUT_S).toBe(TIMEOUT_MS / 1000);
    expect(hb.options[0]?.["sessionTimeout"]).toBe(TIMEOUT_MS / 1000);
  });
});

describe("app session expiry", () => {
  it("keychain session expires after the timeout regardless of activity", async () => {
    const store = await load_store();
    store.login(keychain_user());

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS - 30_000);
    expect(store.isAuthenticated()).toBe(true);

    await vi.advanceTimersByTimeAsync(30_000);
    expect(store.isAuthenticated()).toBe(false);
    expect(store.currentUser()).toBeNull();
    expect(localStorage.getItem("mhp_username")).toBeNull();
    expect(hb.logout_calls).toEqual([]);
  });

  it("hbauth app expiry also ends the HB-Auth session", async () => {
    hb.users = [{ username: "alice", unlocked: true }];
    const store = await load_store();
    store.login(hbauth_user());

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(store.isAuthenticated()).toBe(false);
    expect(hb.logout_calls).toEqual(["alice"]);
    expect(hb.users[0]?.unlocked).toBe(false);
  });

  it("manual logout ends the HB-Auth session", async () => {
    hb.users = [{ username: "alice", unlocked: true }];
    const store = await load_store();
    store.login(hbauth_user());

    store.logout();
    await vi.advanceTimersByTimeAsync(0);
    expect(hb.logout_calls).toEqual(["alice"]);
  });
});

describe("HB-Auth session expiry", () => {
  it("locked HB-Auth wallet logs the app out before the app deadline", async () => {
    hb.users = [{ username: "alice", unlocked: true }];
    const store = await load_store();
    store.login(hbauth_user());

    hb.users[0]!.unlocked = false;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(store.isAuthenticated()).toBe(false);
  });

  it("HB-Auth logout callback logs the app out", async () => {
    hb.users = [{ username: "alice", unlocked: true }];
    const store = await load_store();
    store.login(hbauth_user());
    await vi.advanceTimersByTimeAsync(0);
    expect(hb.session_end_cb).not.toBeNull();

    hb.users[0]!.unlocked = false;
    await hb.session_end_cb?.();
    expect(store.isAuthenticated()).toBe(false);
  });
});

describe("restore_session", () => {
  function persist(
    login_type: string,
    username: string,
    expires_at: number | null = Date.now() + TIMEOUT_MS
  ) {
    localStorage.setItem("mhp_username", username);
    localStorage.setItem("mhp_login_type", login_type);
    localStorage.setItem("mhp_key_type", "posting");
    if (expires_at !== null) localStorage.setItem("mhp_session_expires_at", String(expires_at));
  }

  function stored_values(): string[] {
    return Array.from({ length: localStorage.length }, (_, i) =>
      localStorage.getItem(localStorage.key(i) ?? "") ?? ""
    );
  }

  it("login persists the absolute expiry and never the key marker", async () => {
    const store = await load_store();
    store.login(keychain_user());

    expect(localStorage.getItem("mhp_session_expires_at")).toBe(String(Date.now() + TIMEOUT_MS));
    expect(stored_values()).not.toContain("__KEYCHAIN_MANAGED__");
  });

  it("reload does not extend a keychain session", async () => {
    persist("keychain", "bob", Date.now() + 5 * 60 * 1000);
    const store = await load_store();

    await store.restore_session();
    expect(store.isAuthenticated()).toBe(true);

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(store.isAuthenticated()).toBe(false);
  });

  it("does not restore a keychain session past its expiry", async () => {
    persist("keychain", "bob", Date.now() - 1);
    const store = await load_store();

    await store.restore_session();
    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem("mhp_username")).toBeNull();
  });

  it("does not restore a session without a persisted expiry", async () => {
    persist("keychain", "bob", null);
    const store = await load_store();

    await store.restore_session();
    expect(store.isAuthenticated()).toBe(false);
  });

  it("expired hbauth session is not restored and HB-Auth is locked", async () => {
    hb.users = [{ username: "alice", unlocked: true }];
    persist("hbauth", "alice", Date.now() - 1);
    const store = await load_store();

    await store.restore_session();
    expect(store.isAuthenticated()).toBe(false);
    expect(hb.logout_calls).toEqual(["alice"]);
    expect(localStorage.getItem("mhp_username")).toBeNull();
  });

  it("does not restore hbauth when the HB-Auth session expired", async () => {
    hb.users = [{ username: "alice", unlocked: false }];
    persist("hbauth", "alice");
    const store = await load_store();

    await store.restore_session();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.needsReauth()?.username).toBe("alice");
  });

  it("restores hbauth while unlocked and expires it after the timeout", async () => {
    hb.users = [{ username: "alice", unlocked: true }];
    persist("hbauth", "alice");
    const store = await load_store();

    await store.restore_session();
    expect(store.isAuthenticated()).toBe(true);

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(store.isAuthenticated()).toBe(false);
    expect(hb.logout_calls).toEqual(["alice"]);
  });

  it("does not override a logout made while HB-Auth is checked", async () => {
    hb.users = [{ username: "alice", unlocked: true }];
    hb.users_delay_ms = 1_000;
    persist("hbauth", "alice");
    const store = await load_store();

    const restoring = store.restore_session();
    await vi.advanceTimersByTimeAsync(200);
    store.logout();
    await vi.advanceTimersByTimeAsync(1_000);
    await restoring;

    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem("mhp_username")).toBeNull();
  });

  it("does not override a login made while HB-Auth is checked", async () => {
    hb.users = [{ username: "alice", unlocked: true }];
    hb.users_delay_ms = 1_000;
    persist("hbauth", "alice");
    const store = await load_store();

    const restoring = store.restore_session();
    await vi.advanceTimersByTimeAsync(200);
    store.login(keychain_user("carol"));
    await vi.advanceTimersByTimeAsync(1_000);
    await restoring;

    expect(store.currentUser()?.username).toBe("carol");
    expect(store.currentUser()?.loginType).toBe("keychain");
    expect(localStorage.getItem("mhp_username")).toBe("carol");
  });

  it("does not restore hbauth when the deadline passes during the HB-Auth check", async () => {
    hb.users = [{ username: "alice", unlocked: true }];
    hb.users_delay_ms = 1_000;
    persist("hbauth", "alice", Date.now() + 500);
    const store = await load_store();

    const restoring = store.restore_session();
    await vi.advanceTimersByTimeAsync(1_000);
    await restoring;

    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem("mhp_username")).toBeNull();
    expect(hb.logout_calls).toEqual(["alice"]);
  });

  it("restored keychain session expires after the timeout", async () => {
    persist("keychain", "bob");
    const store = await load_store();

    await store.restore_session();
    expect(store.isAuthenticated()).toBe(true);

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(store.isAuthenticated()).toBe(false);
  });
});
