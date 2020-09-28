import React from 'react';
import PropTypes from 'prop-types';
import ElementButton from '../Button';
import H1Icon from '../../../../../icons/headings/H1';

const H1 = ({ attributes, children }) => (
  <h1 {...attributes}>{children}</h1>
);

H1.defaultProps = {
  attributes: {},
  children: null,
};

H1.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const h1 = {
  button: () => (
    <ElementButton
      format="h1"
    >
      <H1Icon />
    </ElementButton>
  ),
  element: H1,
};

export default h1;
