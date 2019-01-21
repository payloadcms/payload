import React from 'react';
import { SetStepNav } from 'payload/components';

import './index.scss';

const EditView = props => {

  const isEditing = props.data && props.data.slug ? true : false;
  const nav = [{
    url: `/collections/${props.collection.slug}`,
    label: props.collection.label
  }];

  if (isEditing) {
    nav.push({
      url: `/collections/${props.collection.slug}/${props.data.slug}`,
      label: props.data ? props.data[props.collection.uid] : ''
    })
  } else {
    nav.push({
      label: 'Create New'
    })
  }

  return (
    <article className="collection-edit">
      <SetStepNav nav={nav} />
      <header>
        {isEditing &&
          <h1>
            Edit {props.data &&
              props.data[props.collection.uid]
            }
          </h1>
        }
        {!isEditing &&
          <h1>Create New {props.collection.singular}</h1>
        }
      </header>
      {props.children}
    </article>
  );
};

export default EditView;
