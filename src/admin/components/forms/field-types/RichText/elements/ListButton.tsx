import React, { useCallback } from 'react';
import { useSlate } from 'slate-react';
import isListActive from './isListActive';
import toggleElement from './toggle';
import { ButtonProps } from './types';

import '../buttons.scss';

export const baseClass = 'rich-text__button';

const ListButton: React.FC<ButtonProps> = ({ format, children, onClick, className }) => {
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
        isListActive(editor, format) && `${baseClass}__button--active`,
      ].filter(Boolean).join(' ')}
      onClick={onClick || defaultOnClick}
    >
      {children}
    </button>
  );
};

export default ListButton;
