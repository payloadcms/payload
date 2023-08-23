import React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../Config';
import { Props } from './types';
import payloadFavicon from '../../../assets/images/favicon.svg';
import payloadOgImage from '../../../assets/images/og-image.png';
import useMountEffect from '../../../hooks/useMountEffect';

const rtlLanguages = [
  'ar',
  'fa',
  'ha',
  'ku',
  'ur',
  'ps',
  'dv',
  'ks',
  'khw',
  'he',
  'yi',
];

const Meta: React.FC<Props> = ({
  description,
  // lang = 'en',
  meta = [],
  title,
  keywords = 'CMS, Admin, Dashboard',
}) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const currentDirection = rtlLanguages.includes(currentLanguage) ? 'RTL' : 'LTR';

  const config = useConfig();
  const titleSuffix = config.admin.meta?.titleSuffix ?? '- Payload';
  const favicon = config.admin.meta.favicon ?? payloadFavicon;
  const ogImage = config.admin.meta.ogImage ?? payloadOgImage;

  useMountEffect(() => {
    const faviconElement = document.querySelector<HTMLLinkElement>('link[data-placeholder-favicon]');
    if (faviconElement) {
      faviconElement.remove();
    }
  });

  return (
    <Helmet
      htmlAttributes={{
        lang: currentLanguage,
        dir: currentDirection,
      }}
      title={`${title} ${titleSuffix}`}
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
          property: 'og:title',
          content: `${title} ${titleSuffix}`,
        },
        {
          property: 'og:image',
          content: ogImage,
        },
        {
          property: 'og:description',
          content: description,
        },
        {
          property: 'og:type',
          content: 'website',
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
      link={[
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: favicon,
        },
      ]}
    />
  );
};

export default Meta;
