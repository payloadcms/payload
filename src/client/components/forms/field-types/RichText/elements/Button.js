import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSlate } from 'slate-react';
import isElementActive from './isActive';
import toggleElement from './toggle';

import '../buttons.scss';

const baseClass = 'rich-text__button';

const ElementButton = ({ format, children, onClick, className }) => {
  const editor = useSlate();

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
    </button>
  );
};

ElementButton.defaultProps = {
  children: null,
  onClick: undefined,
  className: undefined,
};

ElementButton.propTypes = {
  children: PropTypes.node,
  format: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default ElementButton;
