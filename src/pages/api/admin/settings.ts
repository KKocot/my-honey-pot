import type { APIRoute } from 'astro'
import { getPayloadClient } from '../../../lib/payload'
import type { SettingsData } from '../../../components/admin/types'

export const GET: APIRoute = async () => {
  try {
    const payload = await getPayloadClient()
    const settings = await payload.findGlobal({
      slug: 'settings',
    })

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch {
    return new Response(
      JSON.stringify({ error: 'Błąd pobierania ustawień' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

export const PUT: APIRoute = async ({ request }) => {
  try {
    const data: Partial<SettingsData> = await request.json()
    const payload = await getPayloadClient()

    const updatedSettings = await payload.updateGlobal({
      slug: 'settings',
      data,
    })

    return new Response(JSON.stringify(updatedSettings), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch {
    return new Response(
      JSON.stringify({ error: 'Błąd aktualizacji ustawień' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
