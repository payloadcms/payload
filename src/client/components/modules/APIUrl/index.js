import React from 'react';

import Label from 'payload/client/components/type/Label';

export default props => {
  return (
    <div className="api-url">
      <Label className="uppercase">API URL&nbsp;&mdash;&nbsp;Edit</Label>
      <div><a href={props.url}>{props.url}</a></div>
    </div>
  );
};
