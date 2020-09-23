import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSlate } from 'slate-react';
import icons from './icons';
import isElementActive from './isElementActive';
import toggleElement from './toggleElement';

import './buttons.scss';

const baseClass = 'rich-text__button';

const ElementButton = ({ format, children, icon, onClick, className }) => {
  const editor = useSlate();

  const Icon = icons[icon];

  const defaultOnClick = useCallback((event) => {
    event.preventDefault();
    toggleElement(editor, format);
  }, [editor, format]);

  return (
    <button
      type="button"
      className={[
        baseClass,
        className,
        isElementActive(editor, format) && `${baseClass}__button--active`,
      ].filter(Boolean).join(' ')}
      onClick={onClick || defaultOnClick}
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
  onClick: undefined,
  className: undefined,
};

ElementButton.propTypes = {
  children: PropTypes.node,
  format: PropTypes.string.isRequired,
  icon: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default ElementButton;
