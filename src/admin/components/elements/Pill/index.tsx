import React, { ElementType } from 'react';
import { Link } from 'react-router-dom';
import { Props, RenderedTypeProps } from './types';
import DragIcon from '../../icons/Drag';
import { useDraggableSortable, UseDraggableSortableReturn } from '../DraggableSortable/useDraggableSortable';

import './index.scss';

const baseClass = 'pill';

const PillDragAction: React.FC<Partial<UseDraggableSortableReturn>> = (props) => {
  const {
    listeners,
    attributes,
  } = props;

  return (
    <span
      className={`${baseClass}__drag`}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        // we need to prevent the pill from being clicked while dragging
        e.preventDefault();
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <DragIcon />
    </span>
  );
};

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

  const { attributes, listeners, transform, setNodeRef } = useDraggableSortable({
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
  ].filter(Boolean).join(' ');

  let Element: ElementType | React.FC<RenderedTypeProps> = 'div';

  if (onClick && !to) Element = 'button';
  if (to) Element = Link;

  return (
    <div
      className={classes}
      style={{
        transform: draggable ? transform : undefined,
      }}
      ref={setNodeRef}
    >
      {draggable && (
        <PillDragAction
          attributes={attributes}
          listeners={listeners}
        />
      )}
      <Element
        className={`${baseClass}__content`}
        onClick={onClick}
        type={Element === 'button' ? 'button' : undefined}
        to={to || undefined}
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
    </div>
  );
};

export default Pill;
