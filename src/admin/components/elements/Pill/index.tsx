import React, { ElementType } from 'react';
import { Link } from 'react-router-dom';
import { Props, RenderedTypeProps } from './types';
import { useDraggableSortable } from '../DraggableSortable/useDraggableSortable';

import './index.scss';

const baseClass = 'pill';

const DraggablePill: React.FC<Props> = (props) => {
  const { className, id } = props;

  const { attributes, listeners, transform, setNodeRef, isDragging } = useDraggableSortable({
    id,
  });

  return (
    <StaticPill
      {...props}
      className={[
        isDragging && `${baseClass}--is-dragging`,
        className,
      ].filter(Boolean).join(' ')}
      elementProps={{
        ...listeners,
        ...attributes,
        style: {
          transform,
        },
        ref: setNodeRef,
      }}
    />
  );
};

const StaticPill: React.FC<Props> = (props) => {
  const {
    className,
    to,
    icon,
    alignIcon = 'right',
    onClick,
    pillStyle = 'light',
    draggable,
    children,
    elementProps,
  } = props;

  const classes = [
    baseClass,
    `${baseClass}--style-${pillStyle}`,
    className && className,
    to && `${baseClass}--has-link`,
    (to || onClick) && `${baseClass}--has-action`,
    icon && `${baseClass}--has-icon`,
    icon && `${baseClass}--align-icon-${alignIcon}`,
    draggable && `${baseClass}--draggable`,
  ].filter(Boolean).join(' ');

  let Element: ElementType | React.FC<RenderedTypeProps> = 'div';

  if (onClick && !to) Element = 'button';
  if (to) Element = Link;

  return (
    <Element
      {...elementProps}
      className={classes}
      type={Element === 'button' ? 'button' : undefined}
      to={to || undefined}
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

const Pill: React.FC<Props> = (props) => {
  const { draggable } = props;

  if (draggable) return <DraggablePill {...props} />;
  return <StaticPill {...props} />;
};

export default Pill;
