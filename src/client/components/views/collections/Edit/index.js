import React from 'react';
import SetStepNav from 'payload/client/components/utilities/SetStepNav';

export default props => {
  return (
    <article className="collection-edit">
      <SetStepNav nav={ [
        {
          url: `/collections/${props.slug}`,
          label: props.collection.attrs.label
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
