import type { APIRoute } from 'astro';
import { getSessionWithHeaders, getUser } from '../../../lib/session';

export const GET: APIRoute = async ({ request }) => {
  try {
    const { session, getHeaders } = await getSessionWithHeaders(request);
    const user = getUser(session);

    if (!user) {
      return new Response(
        JSON.stringify({
          user: null,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...getHeaders(),
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        user,
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
    console.error('Get user error:', error);
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
