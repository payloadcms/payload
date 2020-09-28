import React from 'react';
import PropTypes from 'prop-types';
import LeafButton from '../Button';
import CodeIcon from '../../../../../icons/Code';

const Code = ({ attributes, children }) => (
  <code {...attributes}>{children}</code>
);

Code.defaultProps = {
  attributes: {},
  children: null,
};

Code.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const code = {
  button: () => (
    <LeafButton format="code">
      <CodeIcon />
    </LeafButton>
  ),
  leaf: Code,
};

export default code;
