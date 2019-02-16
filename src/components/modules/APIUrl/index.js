import React from 'react';

import './index.scss';

const APIUrl = props => {

  const apiUrl = `${props.serverUrl}/${props.collectionSlug}/${props.slug ? `${props.slug}` : ''}`;

  return (
    <div className="api-url">
      <span className="uppercase-label">API URL</span>
      <div className="url"><a href={apiUrl} rel="noopener noreferrer" target="_blank">{apiUrl}</a></div>
    </div>
  );
};

export default APIUrl;
