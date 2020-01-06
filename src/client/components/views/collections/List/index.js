import React from 'react';
import SetStepNav from '../../../utilities/SetStepNav';

import './index.scss';

const ListView = (props) => {
  return (
    <article className="collection-list">
      <SetStepNav nav={[
        {
          label: props.collection.label,
        },
      ]}
      />
      {props.children}
    </article>
  );
};

export default ListView;
