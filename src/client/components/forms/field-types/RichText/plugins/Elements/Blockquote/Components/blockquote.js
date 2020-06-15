import React from 'react';
import PropTypes from 'prop-types';

import './blockquote.scss';

const BlockquoteElement = ({ attributes, children }) => {
  return <blockquote {...attributes}>{children}</blockquote>;
};

BlockquoteElement.propTypes = {
  attributes: PropTypes.shape({}).isRequired,
  children: PropTypes.node.isRequired,
};

export default BlockquoteElement;
