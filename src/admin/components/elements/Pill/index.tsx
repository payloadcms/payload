import React, { ElementType } from 'react';
import { Link } from 'react-router-dom';
import { Props, RenderedTypeProps } from './types';
import { useDraggableSortable } from '../DraggableSortable/useDraggableSortable';

import './index.scss';

const baseClass = 'pill';

const Pill: React.FC<Props> = (props) => {
  const {
    id,
    className,
    to,
    icon,
    alignIcon = 'right',
    onClick,
    pillStyle = 'light',
    draggable,
    children,
  } = props;

  const { attributes, listeners, transform, setNodeRef, isDragging } = useDraggableSortable({
    id,
  });

  const classes = [
    baseClass,
    `${baseClass}--style-${pillStyle}`,
    className && className,
    to && `${baseClass}--has-link`,
    (to || onClick) && `${baseClass}--has-action`,
    icon && `${baseClass}--has-icon`,
    icon && `${baseClass}--align-icon-${alignIcon}`,
    draggable && `${baseClass}--draggable`,
    isDragging && `${baseClass}--is-dragging`,
  ].filter(Boolean).join(' ');

  let Element: ElementType | React.FC<RenderedTypeProps> = 'div';

  if (onClick && !to) Element = 'button';
  if (to) Element = Link;

  return (
    <Element
      className={classes}
      type={Element === 'button' ? 'button' : undefined}
      to={to || undefined}
      {...draggable ? {
        ...listeners,
        ...attributes,
        style: {
          transform,
        },
        ref: setNodeRef,
      } : {}}
      onClick={onClick}
    >
      {(icon && alignIcon === 'left') && (
        <React.Fragment>
          {icon}
        </React.Fragment>
      )}
      {children}
      {(icon && alignIcon === 'right') && (
        <React.Fragment>
          {icon}
        </React.Fragment>
      )}
    </Element>
  );
};

export default Pill;
