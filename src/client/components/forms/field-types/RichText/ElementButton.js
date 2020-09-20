import React from 'react';
import PropTypes from 'prop-types';
import { useSlate } from 'slate-react';
import icons from './icons';
import isBlockActive from './isElementActive';
import toggleBlock from './toggleElement';

import './buttons.scss';

const baseClass = 'rich-text__button';

const ElementButton = ({ format, children, icon }) => {
  const editor = useSlate();

  const Icon = icons[icon];

  return (
    <button
      type="button"
      className={[
        baseClass,
        isBlockActive(editor, format) && `${baseClass}__button--active`,
      ].filter(Boolean).join(' ')}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      {children}
      {Icon && (
        <div className={`${baseClass}__icon`}><Icon /></div>
      )}
    </button>
  );
};

ElementButton.defaultProps = {
  children: null,
  icon: undefined,
};

ElementButton.propTypes = {
  children: PropTypes.node,
  format: PropTypes.string.isRequired,
  icon: PropTypes.string,
};

export default ElementButton;
