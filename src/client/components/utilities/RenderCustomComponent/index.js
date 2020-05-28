import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import customComponents from '../../customComponents';
import Loading from '../../elements/Loading';

const RenderCustomComponent = (props) => {
  const { path, DefaultComponent, componentProps } = props;

  const CustomComponent = path.split('.').reduce((res, prop) => {
    if (res) {
      return res[prop];
    }

    return false;
  }, customComponents);

  if (CustomComponent) {
    return (
      <Suspense fallback={<Loading />}>
        <CustomComponent {...componentProps} />
      </Suspense>
    );
  }

  return (
    <DefaultComponent {...componentProps} />
  );
};

RenderCustomComponent.propTypes = {
  path: PropTypes.string.isRequired,
  DefaultComponent: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.node,
    PropTypes.element,
  ]).isRequired,
  componentProps: PropTypes.shape({}).isRequired,
};

export default RenderCustomComponent;
