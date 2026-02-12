/**
 * Mock data for community mode E2E tests.
 * Mirrors Hive bridge API response shapes for:
 * - bridge.get_community (CommunityExtended)
 * - bridge.get_ranked_posts (BridgePost[])
 * - bridge.get_account_posts (BridgePost[])
 */

// ============================================
// Community data (bridge.get_community response)
// ============================================

export const MOCK_COMMUNITY = {
  id: 123456,
  name: "hive-123456",
  title: "Test Community",
  about: "A test community for E2E tests",
  description:
    "This is a detailed description of the test community.\nIt supports multiple lines.",
  lang: "en",
  type_id: 1,
  is_nsfw: false,
  subscribers: 1234,
  sum_pending: 42.5,
  num_pending: 15,
  num_authors: 89,
  created_at: "2024-01-15T00:00:00",
  avatar_url: "",
  context: {},
  flag_text: "Rule 1: Be respectful\nRule 2: No spam\nRule 3: Stay on topic",
  settings: {},
  team: [
    ["communityowner", "owner", "Founder"],
    ["communityadmin", "admin", "Head Admin"],
    ["communitymod", "mod", "Moderator"],
  ],
  admins: ["communityadmin"],
};

// ============================================
// Community posts (bridge.get_ranked_posts response)
// ============================================

function make_mock_post(overrides: Record<string, unknown> = {}) {
  const defaults = {
    post_id: 100001,
    author: "testauthor",
    permlink: "test-post-one",
    category: "hive-123456",
    title: "First Test Post",
    body: "This is the body of the first test post.",
    json_metadata: '{"tags":["test","community"],"app":"test/1.0"}',
    created: "2025-12-01T12:00:00",
    updated: "2025-12-01T12:00:00",
    depth: 0,
    children: 3,
    net_rshares: 1000000,
    is_paidout: false,
    payout_at: "2025-12-08T12:00:00",
    payout: 1.5,
    pending_payout_value: "1.500 HBD",
    author_payout_value: "0.000 HBD",
    curator_payout_value: "0.000 HBD",
    promoted: "0.000 HBD",
    replies: [],
    active_votes: [
      { voter: "voter1", rshares: 500000, percent: 10000, reputation: 50 },
    ],
    author_reputation: 65,
    stats: {
      hide: false,
      gray: false,
      total_votes: 5,
      flag_weight: 0,
      is_pinned: false,
    },
    beneficiaries: [],
    max_accepted_payout: "1000000.000 HBD",
    percent_hbd: 10000,
    url: "/hive-123456/@testauthor/test-post-one",
    root_title: "First Test Post",
    author_role: "member",
    author_title: "",
    community: "hive-123456",
    community_title: "Test Community",
    blacklists: [],
  };

  return { ...defaults, ...overrides };
}

export const MOCK_COMMUNITY_POSTS = [
  make_mock_post({
    post_id: 100001,
    author: "testauthor",
    permlink: "pinned-announcement",
    title: "Pinned Announcement",
    stats: {
      hide: false,
      gray: false,
      total_votes: 20,
      flag_weight: 0,
      is_pinned: true,
    },
    author_role: "admin",
    author_title: "Head Admin",
  }),
  make_mock_post({
    post_id: 100002,
    author: "postauthor1",
    permlink: "regular-post-one",
    title: "Regular Post One",
    author_role: "member",
    author_title: "",
  }),
  make_mock_post({
    post_id: 100003,
    author: "postauthor2",
    permlink: "regular-post-two",
    title: "Regular Post Two",
    author_role: "guest",
    author_title: "",
  }),
  make_mock_post({
    post_id: 100004,
    author: "muteduser",
    permlink: "muted-post",
    title: "Muted Post Example",
    stats: {
      hide: false,
      gray: true,
      total_votes: 0,
      flag_weight: 5,
      is_pinned: false,
    },
    author_role: "muted",
    author_title: "",
  }),
];

// ============================================
// Blog config stored on Hive (comment body)
// ============================================

export const MOCK_BLOG_CONFIG = {
  siteName: "Test Community Blog",
  siteDescription: "A blog for the test community",
  postsLayout: "list",
  postsPerPage: 20,
  community_default_sort: "trending",
  community_show_description: true,
  community_show_rules: true,
  community_show_leadership: true,
  community_show_subscribers: true,
};

// ============================================
// Roles list (bridge.list_community_roles)
// ============================================

export const MOCK_COMMUNITY_ROLES = [
  ["communityowner", "owner", "Founder"],
  ["communityadmin", "admin", "Head Admin"],
  ["communitymod", "mod", "Moderator"],
  ["regularmember", "member", ""],
];

// ============================================
// Subscribers list (bridge.list_subscribers)
// ============================================

export const MOCK_SUBSCRIBERS = [
  ["subscriber1", "member", "", "2025-01-01T00:00:00"],
  ["subscriber2", "guest", "", "2025-02-01T00:00:00"],
  ["subscriber3", "guest", "", "2025-03-01T00:00:00"],
];

// ============================================
// Helper: Build JSON-RPC response wrapper
// ============================================

export function make_jsonrpc_response(result: unknown, id: number = 1) {
  return {
    jsonrpc: "2.0",
    result,
    id,
  };
}

// ============================================
// Hive API URL patterns
// ============================================

export const HIVE_API_HOSTS = [
  "api.openhive.network",
  "api.hive.blog",
  "api.deathwing.me",
  "hive-api.arcange.eu",
  "api.syncad.com",
];
