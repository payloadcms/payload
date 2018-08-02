import React from 'react';
import SetStepNav from 'payload/client/components/utilities/SetStepNav';

import './index.css';

export default props => {
  return (
    <article className="collection-archive">
      <SetStepNav nav={ [
        {
          label: props.collection.attrs.label
        }
      ] } />
      {props.children}
    </article>
  );
};
