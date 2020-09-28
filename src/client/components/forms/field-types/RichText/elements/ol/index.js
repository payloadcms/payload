import React from 'react';
import PropTypes from 'prop-types';
import ElementButton from '../Button';
import OLIcon from '../../../../../icons/OrderedList';

const OL = ({ attributes, children }) => (
  <ol {...attributes}>{children}</ol>
);

OL.defaultProps = {
  attributes: {},
  children: null,
};

OL.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const ol = {
  button: () => (
    <ElementButton format="ol">
      <OLIcon />
    </ElementButton>
  ),
  element: OL,
};

export default ol;
