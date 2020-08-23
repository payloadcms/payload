import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import config from 'payload/config';

function Meta({ description, lang, meta, title, image, keywords }) {
  const titleSuffix = config?.admin?.meta?.titleSuffix ?? '- Payload';
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
          content: image,
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
