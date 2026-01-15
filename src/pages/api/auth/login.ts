import type { APIRoute } from 'astro';
import { getSessionWithHeaders, createUser, LoginType } from '../../../lib/session';
import { verifyHiveSignature, validateLoginRequest, getAvatarUrl } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request data
    const loginData = validateLoginRequest(body);
    if (!loginData) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request. Required: username, signature, message, keyType',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { username, signature, message, keyType } = loginData;

    // Verify the signature against Hive blockchain
    const verification = await verifyHiveSignature(username, signature, message, keyType);

    if (!verification.valid) {
      return new Response(
        JSON.stringify({
          error: verification.error || 'Invalid signature',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create session
    const { session, getHeaders } = await getSessionWithHeaders(request);

    // Store user in session
    session.user = createUser(
      username,
      LoginType.hbauth,
      keyType,
      getAvatarUrl(username)
    );

    await session.save();

    // Return success with user data
    return new Response(
      JSON.stringify({
        user: session.user,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(),
        },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
