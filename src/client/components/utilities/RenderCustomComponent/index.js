import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import customComponents from '../../customComponents';
import Loading from '../../elements/Loading';

const RenderCustomComponent = (props) => {
  const { path, DefaultComponent, componentProps } = props;

  if (path) {
    const CustomComponent = path.split('.').reduce((res, prop) => {
      const potentialRowIndex = parseInt(prop, 10);

      if (!Number.isNaN(potentialRowIndex) && res.fields) {
        return res.fields;
      }

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
  }

  return (
    <DefaultComponent {...componentProps} />
  );
};

RenderCustomComponent.defaultProps = {
  path: undefined,
};

RenderCustomComponent.propTypes = {
  path: PropTypes.string,
  DefaultComponent: PropTypes.oneOfType([
    PropTypes.shape({}),
    PropTypes.func,
    PropTypes.node,
    PropTypes.element,
  ]).isRequired,
  componentProps: PropTypes.shape({}).isRequired,
};

export default RenderCustomComponent;
