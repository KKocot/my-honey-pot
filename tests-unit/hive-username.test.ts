// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { describe, expect, it } from "vitest";
import { is_valid_hive_username } from "../src/components/auth/constants";

describe("is_valid_hive_username", () => {
  it.each([
    "abc",
    "barddev",
    "a1b",
    "my-account",
    "a--b",
    "abc.def",
    "abc.def.ghi",
    "hive.blog",
    "abcdefghijklmnop",
  ])("accepts %s", (name) => {
    expect(is_valid_hive_username(name)).toBe(true);
  });

  it.each([
    ["", "empty"],
    ["ab", "too short"],
    ["abcdefghijklmnopq", "17 chars"],
    ["1abc", "starts with digit"],
    ["-abc", "starts with hyphen"],
    ["abc-", "ends with hyphen"],
    ["Abc", "uppercase"],
    ["ab_c", "underscore"],
    ["abc.de", "short segment"],
    ["ab.cde", "short first segment"],
    [".abc", "leading dot"],
    ["abc.", "trailing dot"],
    ["abc..def", "double dot"],
    ["abc.1de", "segment starts with digit"],
    ["abc-.def", "segment ends with hyphen"],
    ["abc def", "space"],
  ])("rejects %s (%s)", (name) => {
    expect(is_valid_hive_username(name)).toBe(false);
  });
});
