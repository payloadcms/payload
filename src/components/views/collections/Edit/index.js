import React from 'react';
import { SetStepNav } from 'payload/components';

import './index.scss';

const EditView = props => {

  function title() {
    // TODO: this doesn't work because props.locale is missing
    // TODO: if the app is not using localization this will need to be revisited
    if (Object.keys(props.data).length > 0 && props.locale) {
      return props.data[props.collection.useAsTitle] ? props.data[props.collection.useAsTitle]['en'] || props.data[props.collection.useAsTitle] : '[Untitled]';
    }
    return '[Untitled]';
  }

  const nav = [{
    url: `/collections/${props.collection.slug}`,
    label: props.collection.label
  }];

  if (props.isEditing) {
    nav.push({
      url: `/collections/${props.collection.slug}/${props.data._id}`,
      label: props.data ? title() : ''
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
        {props.isEditing &&
          <h1>
            Edit {title()}
          </h1>
        }
        {!props.isEditing &&
          <h1>Create New {props.collection.singular}</h1>
        }
      </header>
      {props.children}
    </article>
  );
};

export default EditView;
