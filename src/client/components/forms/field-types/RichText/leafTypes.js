import React from 'react';
import PropTypes from 'prop-types';
import LeafButton from './LeafButton';

const leafDefaultProps = {
  attributes: {},
  children: null,
};

const leafPropTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const Bold = ({ attributes, children }) => (
  <strong {...attributes}>{children}</strong>
);

const Italic = ({ attributes, children }) => (
  <em {...attributes}>{children}</em>
);

const Underline = ({ attributes, children }) => (
  <u {...attributes}>{children}</u>
);

Bold.defaultProps = leafDefaultProps;
Bold.propTypes = leafPropTypes;

Italic.defaultProps = leafDefaultProps;
Italic.propTypes = leafPropTypes;

Underline.defaultProps = leafDefaultProps;
Underline.propTypes = leafPropTypes;

const leafTypes = {
  bold: {
    button: () => (
      <LeafButton
        format="bold"
        icon="bold"
      />
    ),
    leaf: Bold,
  },
  italic: {
    button: () => (
      <LeafButton
        format="italic"
        icon="italic"
      />
    ),
    leaf: Italic,
  },
  underline: {
    button: () => (
      <LeafButton
        format="underline"
        icon="underline"
      />
    ),
    leaf: Underline,
  },
};

export default leafTypes;
