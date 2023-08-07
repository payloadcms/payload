import React from 'react';
import withCondition from '../../withCondition';
import { UIField } from '../../../../../fields/config/types';

const UI: React.FC<UIField> = (props) => {
  const {
    admin: {
      components: {
        Field,
      },
    },
  } = props;

  if (Field) {
    return <Field {...props} />;
  }

  return null;
};

export default withCondition(UI);
