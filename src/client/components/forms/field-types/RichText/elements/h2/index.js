import React from 'react';
import PropTypes from 'prop-types';
import ElementButton from '../Button';
import H2Icon from '../../../../../icons/headings/H2';

const H2 = ({ attributes, children }) => (
  <h2 {...attributes}>{children}</h2>
);

H2.defaultProps = {
  attributes: {},
  children: null,
};

H2.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const h2 = {
  button: () => (
    <ElementButton format="h2">
      <H2Icon />
    </ElementButton>
  ),
  element: H2,
};

export default h2;
