import React from 'react';
import PropTypes from 'prop-types';
import { useSlate } from 'slate-react';
import isMarkActive from './isActive';
import toggleLeaf from './toggle';

import '../buttons.scss';

const baseClass = 'rich-text__button';

const LeafButton = ({ format, children }) => {
  const editor = useSlate();

  return (
    <button
      type="button"
      className={[
        baseClass,
        isMarkActive(editor, format) && `${baseClass}__button--active`,
      ].filter(Boolean).join(' ')}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleLeaf(editor, format);
      }}
    >
      {children}
    </button>
  );
};

LeafButton.defaultProps = {
  children: null,
};

LeafButton.propTypes = {
  children: PropTypes.node,
  format: PropTypes.string.isRequired,
};

export default LeafButton;
