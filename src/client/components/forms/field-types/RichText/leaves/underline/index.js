import React from 'react';
import PropTypes from 'prop-types';
import LeafButton from '../Button';
import UnderlineIcon from '../../../../../icons/Underline';

const Underline = ({ attributes, children }) => (
  <u {...attributes}>{children}</u>
);

Underline.defaultProps = {
  attributes: {},
  children: null,
};

Underline.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const underline = {
  button: () => (
    <LeafButton format="underline">
      <UnderlineIcon />
    </LeafButton>
  ),
  leaf: Underline,
};

export default underline;
