import React, { ElementType, useCallback, useState } from 'react';
import { useSlate } from 'slate-react';
import isElementActive from './isActive';
import toggleElement from './toggle';
import { ButtonProps } from './types';
import Tooltip from '../../../../elements/Tooltip';

import '../buttons.scss';

export const baseClass = 'rich-text__button';

const ElementButton: React.FC<ButtonProps> = (props) => {
  const {
    format,
    children,
    onClick,
    className,
    tooltip,
    el = 'button',
  } = props;

  const editor = useSlate();
  const [showTooltip, setShowTooltip] = useState(false);

  const defaultOnClick = useCallback((event) => {
    event.preventDefault();
    setShowTooltip(false);
    toggleElement(editor, format);
  }, [editor, format]);

  const Tag: ElementType = el;

  return (
    <Tag
      {...el === 'button' && { type: 'button' }}
      className={[
        baseClass,
        className,
        isElementActive(editor, format) && `${baseClass}__button--active`,
      ].filter(Boolean).join(' ')}
      onClick={onClick || defaultOnClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {tooltip && (
        <Tooltip show={showTooltip}>
          {tooltip}
        </Tooltip>
      )}
      {children}
    </Tag>
  );
};

export default ElementButton;
