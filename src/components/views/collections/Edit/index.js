import React from 'react';
import { SetStepNav } from 'payload/components';

import './index.css';

const Edit = props => {
  return (
    <article className="collection-edit">
      <SetStepNav nav={ [
        {
          url: `/collections/${props.slug}`,
          label: props.collection.label
        },
        {
          url: `/collections/${props.slug}/${props.id}`,
          label: props.id
        }
      ] } />
      {props.children}
    </article>
  );
};

export default Edit;
