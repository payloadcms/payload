import React from 'react';
import { Props } from './types';
import withCondition from '../../forms/withCondition';

const RenderCustomComponent: React.FC<Props> = (props) => {
  const { CustomComponent, DefaultComponent, componentProps } = props;

  if (CustomComponent) {
    const ConditionalCustomComponent = withCondition(CustomComponent);
    return (
      <ConditionalCustomComponent {...componentProps} />
    );
  }

  return (
    <DefaultComponent {...componentProps} />
  );
};

export default RenderCustomComponent;
