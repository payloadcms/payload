import React from 'react';
import PropTypes from 'prop-types';
import LeafButton from '../Button';
import StrikethroughIcon from '../../../../../icons/Strikethrough';

const Strikethrough = ({ attributes, children }) => (
  <span
    style={{ textDecoration: 'line-through' }}
    {...attributes}
  >
    {children}
  </span>
);

Strikethrough.defaultProps = {
  attributes: {},
  children: null,
};

Strikethrough.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const strikethrough = {
  button: () => (
    <LeafButton format="strikethrough">
      <StrikethroughIcon />
    </LeafButton>
  ),
  leaf: Strikethrough,
};

export default strikethrough;
