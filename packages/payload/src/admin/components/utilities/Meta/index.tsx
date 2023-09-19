import React from 'react'
import Helmet from 'react-helmet'
import { useTranslation } from 'react-i18next'

import type { Props } from './types'

import payloadFavicon from '../../../assets/images/favicon.svg'
import payloadOgImage from '../../../assets/images/og-image.png'
import useMountEffect from '../../../hooks/useMountEffect'
import { useConfig } from '../Config'

const rtlLanguages = ['ar', 'fa', 'ha', 'ku', 'ur', 'ps', 'dv', 'ks', 'khw', 'he', 'yi']

const Meta: React.FC<Props> = ({
  description,
  keywords = 'CMS, Admin, Dashboard',
  // lang = 'en',
  meta = [],
  title,
}) => {
  const { i18n } = useTranslation()
  const currentLanguage = i18n.language
  const currentDirection = rtlLanguages.includes(currentLanguage) ? 'RTL' : 'LTR'

  const config = useConfig()
  const titleSuffix = config.admin.meta?.titleSuffix ?? '- Payload'
  const favicon = config.admin.meta.favicon ?? payloadFavicon
  const ogImage = config.admin.meta.ogImage ?? payloadOgImage

  useMountEffect(() => {
    const faviconElement = document.querySelector<HTMLLinkElement>('link[data-placeholder-favicon]')
    if (faviconElement) {
      faviconElement.remove()
    }
  })

  return (
    <Helmet
      htmlAttributes={{
        dir: currentDirection,
        lang: currentLanguage,
      }}
      link={[
        {
          href: favicon,
          rel: 'icon',
          type: 'image/svg+xml',
        },
      ]}
      meta={[
        {
          name: 'description',
          content: description,
        },
        {
          name: 'keywords',
          content: keywords,
        },
        {
          content: `${title} ${titleSuffix}`,
          property: 'og:title',
        },
        {
          content: ogImage,
          property: 'og:image',
        },
        {
          content: description,
          property: 'og:description',
        },
        {
          content: 'website',
          property: 'og:type',
        },
        {
          name: 'twitter:card',
          content: 'summary',
        },
        {
          name: 'twitter:title',
          content: title,
        },
        {
          name: 'twitter:description',
          content: description,
        },
      ].concat(meta)}
      title={`${title} ${titleSuffix}`}
    />
  )
}

export default Meta
