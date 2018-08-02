import React from 'react';
import SetStepNav from 'payload/client/components/utilities/SetStepNav';

export default props => {
  return (
    <article className="collection-add">
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
