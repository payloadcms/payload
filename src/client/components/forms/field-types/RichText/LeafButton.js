import React from 'react';
import PropTypes from 'prop-types';
import { useSlate } from 'slate-react';
import icons from './icons';
import isMarkActive from './isLeafActive';
import toggleLeaf from './toggleLeaf';

import './buttons.scss';

const baseClass = 'rich-text__button';

const LeafButton = ({ format, children, icon }) => {
  const editor = useSlate();

  const Icon = icons[icon];

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
      {Icon && (
        <div className={`${baseClass}__icon`}><Icon /></div>
      )}
    </button>
  );
};

LeafButton.defaultProps = {
  children: null,
  icon: undefined,
};

LeafButton.propTypes = {
  children: PropTypes.node,
  format: PropTypes.string.isRequired,
  icon: PropTypes.string,
};

export default LeafButton;
