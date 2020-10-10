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
  Button: () => (
    <ElementButton format="ol">
      <OLIcon />
    </ElementButton>
  ),
  Element: OL,
};

export default ol;
