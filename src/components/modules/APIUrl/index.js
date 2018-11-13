import React from 'react';

import { Label, Input } from 'payload/components';

const APIUrl = props => {

  const apiUrl = `${props.serverUrl}/${props.collectionSlug}?slug=${props.slug ? `${props.slug}` : ''}`;

  return (
    <div className="api-url">
      <Label className="uppercase">API URL&nbsp;&mdash;&nbsp;Edit</Label>
      <div><a href={apiUrl}>{apiUrl}</a></div>
      <Input type="hidden" name="slug" value={props.slug} />
    </div>
  );
};

export default APIUrl;
