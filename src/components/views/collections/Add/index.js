import React from 'react';
import { SetStepNav } from 'payload/components';

import './index.css';

const Add = props => {
  return (
    <article className={`collection-add collection-${props.slug}`}>
      <SetStepNav nav={ [
        {
          url: `/collections/${props.slug}`,
          label: props.collection.label
        },
        {
          label: 'Add New'
        }
      ] } />
      {props.children}
    </article>
  );
};

export default Add;
