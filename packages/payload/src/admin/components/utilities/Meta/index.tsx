import React from 'react';
import Helmet from 'react-helmet';
import { useConfig } from '../Config';
import { Props } from './types';
import payloadFavicon from '../../../assets/images/favicon.svg';
import payloadOgImage from '../../../assets/images/og-image.png';
import useMountEffect from '../../../hooks/useMountEffect';

const Meta: React.FC<Props> = ({
  description,
  lang = 'en',
  meta = [],
  title,
  keywords = 'CMS, Admin, Dashboard',
}) => {
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
        lang,
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
