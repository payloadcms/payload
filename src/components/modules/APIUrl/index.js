import React from 'react';

import { Label, Input } from 'payload/components';

const APIUrl = props => {

  const apiUrl = `${props.serverUrl}/${props.collectionSlug}/${props.slug ? `${props.slug}` : ''}`;

  return (
    <div className="api-url">
      <Label className="uppercase">API URL</Label>
      <div><a href={apiUrl} rel="noopener noreferrer" target="_blank">{apiUrl}</a></div>
      <Input type="hidden" name="slug" valueOverride={props.slug} />
    </div>
  );
};

export default APIUrl;
