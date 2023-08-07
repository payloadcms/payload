import React from 'react';
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

export default LeafButton;
