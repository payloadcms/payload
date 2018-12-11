import React from 'react';
import { Label } from 'payload/components';

import './index.scss';

const APIUrl = props => {

  const apiUrl = `${props.serverUrl}/${props.collectionSlug}/${props.slug ? `${props.slug}` : ''}`;

  return (
    <div className="api-url">
      <Label className="uppercase">API URL</Label>
      <div className="url"><a href={apiUrl} rel="noopener noreferrer" target="_blank">{apiUrl}</a></div>
    </div>
  );
};

export default APIUrl;
