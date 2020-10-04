import React from 'react';
import PropTypes from 'prop-types';
import LeafButton from '../Button';
import StrikethroughIcon from '../../../../../icons/Strikethrough';

const Strikethrough = ({ attributes, children }) => (
  <del {...attributes}>
    {children}
  </del>
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
  Button: () => (
    <LeafButton format="strikethrough">
      <StrikethroughIcon />
    </LeafButton>
  ),
  Leaf: Strikethrough,
};

export default strikethrough;
