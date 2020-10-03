import React from 'react';
import PropTypes from 'prop-types';

const RenderCustomComponent = (props) => {
  const { CustomComponent, DefaultComponent, componentProps } = props;

  if (CustomComponent) {
    return (
      <CustomComponent {...componentProps} />
    );
  }

  return (
    <DefaultComponent {...componentProps} />
  );
};

RenderCustomComponent.defaultProps = {
  path: undefined,
  componentProps: {},
  CustomComponent: null,
};

RenderCustomComponent.propTypes = {
  path: PropTypes.string,
  DefaultComponent: PropTypes.oneOfType([
    PropTypes.shape({}),
    PropTypes.func,
    PropTypes.node,
    PropTypes.element,
  ]).isRequired,
  CustomComponent: PropTypes.func,
  componentProps: PropTypes.shape({}),
};

export default RenderCustomComponent;
