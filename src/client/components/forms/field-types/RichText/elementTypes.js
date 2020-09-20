import React from 'react';
import PropTypes from 'prop-types';
import ElementButton from './ElementButton';

const elementDefaultProps = {
  attributes: {},
  children: null,
};

const elementPropTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const UL = ({ attributes, children }) => (
  <ul {...attributes}>{children}</ul>
);

const OL = ({ attributes, children }) => (
  <ol {...attributes}>{children}</ol>
);

const LI = ({ attributes, children }) => (
  <li {...attributes}>{children}</li>
);

UL.defaultProps = elementDefaultProps;
UL.propTypes = elementPropTypes;

OL.defaultProps = elementDefaultProps;
OL.propTypes = elementPropTypes;

LI.defaultProps = elementDefaultProps;
LI.propTypes = elementPropTypes;

const elementTypes = {
  ul: {
    button: () => (
      <ElementButton
        format="ul"
        icon="ul"
      />
    ),
    element: UL,
  },
  ol: {
    button: () => (
      <ElementButton
        format="ol"
        icon="ol"
      />
    ),
    element: OL,
  },
  li: {
    element: LI,
  },
};

export default elementTypes;
