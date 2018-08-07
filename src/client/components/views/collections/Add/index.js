import React from 'react';
import SetStepNav from 'payload/client/components/utilities/SetStepNav';

import './index.css';

export default props => {
  return (
    <article className={`collection-add collection-${props.slug}`}>
      <SetStepNav nav={ [
        {
          url: `/collections/${props.slug}`,
          label: props.collection.attrs.label
        },
        {
          label: 'Add New'
        }
      ] } />
      {props.children}
    </article>
  );
};
