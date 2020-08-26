import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import config from 'payload/config';
import payloadFavicon from '../../../assets/images/favicon.svg';
import payloadOgImage from '../../../assets/images/og-image.png';

function Meta({ description, lang, meta, title, keywords }) {
  const titleSuffix = config?.admin?.meta?.titleSuffix ?? '- Payload';
  const favicon = config?.admin?.meta?.favicon ?? payloadFavicon;
  const ogImage = config?.admin?.meta?.ogImage ?? payloadOgImage;
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
}

Meta.defaultProps = {
  lang: 'en',
  meta: [],
  description: '',
  image: '/images/default-og.png',
  keywords: 'CMS, Admin, Dashboard',
};

Meta.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.string.isRequired,
  image: PropTypes.string,
  keywords: PropTypes.string,
};

export default Meta;
