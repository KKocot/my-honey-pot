import type { APIRoute } from 'astro'
import { getPayloadClient } from '../../lib/payload'

interface SiteSettings {
  siteTheme: 'light' | 'dark' | 'green' | 'pink'
  siteName: string
  siteDescription: string
}

export const GET: APIRoute = async () => {
  try {
    const payload = await getPayloadClient()
    const settings = await payload.findGlobal({
      slug: 'settings',
    })

    const siteSettings: SiteSettings = {
      siteTheme: (settings.siteTheme as SiteSettings['siteTheme']) || 'light',
      siteName: (settings.siteName as string) || 'Astro + Payload CMS',
      siteDescription: (settings.siteDescription as string) || 'Projekt startowy z integracją Payload CMS',
    }

    return new Response(JSON.stringify(siteSettings), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch {
    return new Response(
      JSON.stringify({
        siteTheme: 'light',
        siteName: 'Astro + Payload CMS',
        siteDescription: 'Projekt startowy z integracją Payload CMS',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
