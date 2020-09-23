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

const Code = ({ attributes, children }) => (
  <code {...attributes}>{children}</code>
);

const Strikethrough = ({ attributes, children }) => (
  <span
    style={{ textDecoration: 'line-through' }}
    {...attributes}
  >
    {children}
  </span>
);

Bold.defaultProps = leafDefaultProps;
Bold.propTypes = leafPropTypes;

Italic.defaultProps = leafDefaultProps;
Italic.propTypes = leafPropTypes;

Underline.defaultProps = leafDefaultProps;
Underline.propTypes = leafPropTypes;

Code.defaultProps = leafDefaultProps;
Code.propTypes = leafPropTypes;

Strikethrough.defaultProps = leafDefaultProps;
Strikethrough.propTypes = leafPropTypes;

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
  strikethrough: {
    button: () => (
      <LeafButton
        format="strikethrough"
        icon="strikethrough"
      />
    ),
    leaf: Strikethrough,
  },
  code: {
    button: () => (
      <LeafButton
        format="code"
        icon="code"
      />
    ),
    leaf: Code,
  },
};

export default leafTypes;
