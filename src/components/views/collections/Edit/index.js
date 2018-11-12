import React from 'react';
import { SetStepNav } from 'payload/components';

import './index.css';

const Edit = props => {

  const nav = [
    {
      url: `/collections/${props.slug}`,
      label: props.collection.label
    }
  ];

  if (props.action === 'create') {
    nav.push({
      label: 'Create New'
    })
  }

  if (props.action === 'edit') {
    nav.push({
      url: `/collections/${props.slug}/${props.id}`,
      label: props.id
    })
  }

  return (
    <article className="collection-edit">
      <SetStepNav nav={ nav } />
      {props.children}
    </article>
  );
};

export default Edit;
