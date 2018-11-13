import React from 'react';
import { SetStepNav } from 'payload/components';

import './index.css';

const Edit = props => {

  const nav = [{
      url: `/collections/${props.collection.slug}`,
      label: props.collection.label
  }];

  if (!props.isEditing) {
    nav.push({
      label: 'Create New'
    })
  } else {
    nav.push({
      url: `/collections/${props.collectionSlug}/${props.slug}`,
      label: props.slug
    })
  }

  return (
    <article className="collection-edit">
      <SetStepNav nav={ nav } />
      <header>
        {props.isEditing &&
          <h1>Edit Page {}</h1>
        }
        {!props.isEditing &&
          <h1>Create New Page</h1>
        }
      </header>
      {props.children}
    </article>
  );
};

export default Edit;
