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
    // Card Layout Settings
    {
      name: 'cardLayout',
      label: 'Układ karty',
      type: 'select',
      defaultValue: 'horizontal',
      options: [
        { label: 'Poziomy (miniaturka obok)', value: 'horizontal' },
        { label: 'Pionowy (miniaturka nad)', value: 'vertical' },
      ],
    },
    {
      name: 'thumbnailPosition',
      label: 'Pozycja miniaturki',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Po lewej', value: 'left' },
        { label: 'Po prawej', value: 'right' },
      ],
      admin: {
        condition: (data) => data?.cardLayout === 'horizontal',
      },
    },
    {
      name: 'thumbnailSize',
      label: 'Rozmiar miniaturki',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Mały (64px)', value: 'small' },
        { label: 'Średni (96px)', value: 'medium' },
        { label: 'Duży (128px)', value: 'large' },
        { label: 'Bardzo duży (160px)', value: 'xlarge' },
        { label: 'Ogromny (200px)', value: 'xxlarge' },
      ],
    },
    {
      name: 'cardPadding',
      label: 'Padding karty',
      type: 'select',
      defaultValue: 'normal',
      options: [
        { label: 'Kompaktowy', value: 'compact' },
        { label: 'Normalny', value: 'normal' },
        { label: 'Przestronny', value: 'spacious' },
      ],
    },
    {
      name: 'cardBorderRadius',
      label: 'Zaokrąglenie rogów',
      type: 'select',
      defaultValue: 'large',
      options: [
        { label: 'Brak', value: 'none' },
        { label: 'Małe', value: 'small' },
        { label: 'Średnie', value: 'medium' },
        { label: 'Duże', value: 'large' },
      ],
    },
    // Visibility Settings
    {
      name: 'showThumbnail',
      label: 'Pokaż miniaturkę',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showDate',
      label: 'Pokaż datę',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showVotes',
      label: 'Pokaż głosy',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showComments',
      label: 'Pokaż komentarze',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showPayout',
      label: 'Pokaż payout',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showTags',
      label: 'Pokaż tagi',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'maxTags',
      label: 'Maksymalna liczba tagów',
      type: 'number',
      defaultValue: 5,
      min: 1,
      max: 10,
      admin: {
        condition: (data) => data?.showTags === true,
      },
    },
    // Style Settings
    {
      name: 'titleSize',
      label: 'Rozmiar tytułu',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Mały', value: 'small' },
        { label: 'Średni', value: 'medium' },
        { label: 'Duży', value: 'large' },
      ],
    },
    {
      name: 'cardBorder',
      label: 'Pokaż ramkę karty',
      type: 'checkbox',
      defaultValue: true,
    },
    // Homepage Layout Settings
    {
      name: 'showHeader',
      label: 'Pokaż nagłówek strony',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showAuthorProfile',
      label: 'Pokaż profil autora',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'authorAvatarSize',
      label: 'Rozmiar awatara autora',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Mały (48px)', value: 'small' },
        { label: 'Średni (64px)', value: 'medium' },
        { label: 'Duży (80px)', value: 'large' },
        { label: 'Bardzo duży (96px)', value: 'xlarge' },
      ],
      admin: {
        condition: (data) => data?.showAuthorProfile === true,
      },
    },
    {
      name: 'showPostCount',
      label: 'Pokaż liczbę postów autora',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        condition: (data) => data?.showAuthorProfile === true,
      },
    },
    {
      name: 'showAuthorRewards',
      label: 'Pokaż nagrody autora',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        condition: (data) => data?.showAuthorProfile === true,
      },
    },
    {
      name: 'postsPerPage',
      label: 'Liczba postów na stronie',
      type: 'number',
      defaultValue: 20,
      min: 5,
      max: 50,
    },
  ],
}
