import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Ustawienia strony',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'siteTheme',
      label: 'Motyw kolorystyczny',
      type: 'select',
      required: true,
      defaultValue: 'light',
      options: [
        {
          label: 'Jasny (Light)',
          value: 'light',
        },
        {
          label: 'Ciemny (Dark)',
          value: 'dark',
        },
        {
          label: 'Zielony (Green)',
          value: 'green',
        },
        {
          label: 'Różowy (Pink)',
          value: 'pink',
        },
      ],
    },
    {
      name: 'siteName',
      label: 'Nazwa strony',
      type: 'text',
      defaultValue: 'Astro + Payload CMS',
    },
    {
      name: 'siteDescription',
      label: 'Opis strony',
      type: 'textarea',
      defaultValue: 'Projekt startowy z integracją Payload CMS',
    },
  ],
}
