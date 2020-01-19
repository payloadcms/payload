import React, { useEffect } from 'react';
import { useStepNav } from '../../../modules/StepNav';

import './index.scss';

const EditView = props => {
  const { setStepNav } = useStepNav();

  const nav = [{
    url: `/collections/${props.collection.slug}`,
    label: props.collection.label
  }];

  if (props.isEditing) {
    nav.push({
      url: `/collections/${props.collection.slug}/${props.data._id}`,
      label: props.data ? props.data[props.collection.useAsTitle] : ''
    })
  } else {
    nav.push({
      label: 'Create New'
    })
  }

  useEffect(() => setStepNav(nav), []);

  return (
    <article className="collection-edit">
      <header>
        {props.isEditing &&
          <h1>
            Edit {Object.keys(props.data).length > 0 &&
              (props.data[props.collection.useAsTitle] ? props.data[props.collection.useAsTitle] : '[Untitled]')
            }
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
