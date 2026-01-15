import type { APIRoute } from 'astro';
import { getSessionWithHeaders } from '../../../lib/session';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { session, getHeaders } = await getSessionWithHeaders(request);

    // Destroy the session
    session.destroy();

    return new Response(
      JSON.stringify({
        success: true,
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
    console.error('Logout error:', error);
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
