import React from 'react';
import PropTypes from 'prop-types';
import LeafButton from '../Button';
import BoldIcon from '../../../../../icons/Bold';

const Bold = ({ attributes, children }) => (
  <strong {...attributes}>{children}</strong>
);

Bold.defaultProps = {
  attributes: {},
  children: null,
};

Bold.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const bold = {
  Button: () => (
    <LeafButton format="bold">
      <BoldIcon />
    </LeafButton>
  ),
  Leaf: Bold,
};

export default bold;
