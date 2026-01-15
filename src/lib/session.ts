import { getIronSession, type SessionOptions, type IronSession } from 'iron-session';

// ============================================================================
// Types
// ============================================================================

/** Supported login methods */
export enum LoginType {
  hbauth = 'hbauth',
  keychain = 'keychain',
}

/** Supported key types for signing */
export enum KeyType {
  posting = 'posting',
  active = 'active',
}

/** User data stored in session */
export interface User {
  isLoggedIn: boolean;
  username: string;
  avatarUrl: string;
  loginType: LoginType;
  keyType: KeyType;
}

/** Session data structure */
export interface SessionData {
  user?: User;
}

// ============================================================================
// Configuration
// ============================================================================

const COOKIE_NAME = 'light_blog_session';

/**
 * Get session password from environment
 * Must be at least 32 characters long
 */
function getSessionPassword(): string {
  const password = import.meta.env.SESSION_SECRET || process.env.SESSION_SECRET;

  if (!password) {
    throw new Error(
      'SESSION_SECRET environment variable is required. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }

  if (password.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }

  return password;
}

/** Session options for iron-session */
export const sessionOptions: SessionOptions = {
  password: getSessionPassword(),
  cookieName: COOKIE_NAME,
  cookieOptions: {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
  },
};

// ============================================================================
// Session Utilities
// ============================================================================

/**
 * Get session from Astro API context
 * Use this in API routes
 *
 * @example
 * ```ts
 * export const GET: APIRoute = async ({ request, cookies }) => {
 *   const session = await getSession(request, cookies);
 *   if (!session.user?.isLoggedIn) {
 *     return new Response('Unauthorized', { status: 401 });
 *   }
 *   // ... handle authenticated request
 * }
 * ```
 */
export async function getSession(
  request: Request,
  cookies: { get: (name: string) => { value: string } | undefined }
): Promise<IronSession<SessionData>> {
  // Create a minimal Response-like object for iron-session
  const res = {
    getHeader: () => undefined,
    setHeader: () => {},
  };

  return getIronSession<SessionData>(request, res as any, sessionOptions);
}

/**
 * Get session and return Response headers for setting cookie
 * Use this when you need to modify the session
 *
 * @example
 * ```ts
 * export const POST: APIRoute = async ({ request }) => {
 *   const { session, getHeaders } = await getSessionWithHeaders(request);
 *   session.user = { isLoggedIn: true, username: 'alice', ... };
 *   await session.save();
 *
 *   return new Response(JSON.stringify({ ok: true }), {
 *     headers: { 'Content-Type': 'application/json', ...getHeaders() },
 *   });
 * }
 * ```
 */
export async function getSessionWithHeaders(
  request: Request
): Promise<{
  session: IronSession<SessionData>;
  getHeaders: () => Record<string, string>;
}> {
  const headers: Record<string, string> = {};

  const res = {
    getHeader: (name: string) => headers[name.toLowerCase()],
    setHeader: (name: string, value: string) => {
      headers[name.toLowerCase()] = value;
    },
  };

  const session = await getIronSession<SessionData>(request, res as any, sessionOptions);

  return {
    session,
    getHeaders: () => headers,
  };
}

/**
 * Create a logged-in user object
 */
export function createUser(
  username: string,
  loginType: LoginType,
  keyType: KeyType,
  avatarUrl?: string
): User {
  return {
    isLoggedIn: true,
    username,
    avatarUrl: avatarUrl || `https://images.hive.blog/u/${username}/avatar`,
    loginType,
    keyType,
  };
}

/**
 * Check if user is logged in from session
 */
export function isAuthenticated(session: IronSession<SessionData>): boolean {
  return session.user?.isLoggedIn === true;
}

/**
 * Get the logged-in user or null
 */
export function getUser(session: IronSession<SessionData>): User | null {
  if (session.user?.isLoggedIn) {
    return session.user;
  }
  return null;
}
