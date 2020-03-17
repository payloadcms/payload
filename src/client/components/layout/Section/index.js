import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import './index.scss';
import IconButton from '../../controls/IconButton';

const baseClass = 'section';

const Section = React.forwardRef((props, ref) => {
  const {
    className, heading, children, rowCount, addInitialRow,
  } = props;

  const classes = [
    baseClass,
    className && className,
  ].filter(Boolean).join(' ');

  const [isSectionOpen, setIsSectionOpen] = useState(true);

  const iconProps = {};
  iconProps.iconName = `${rowCount === 0 ? 'crosshair' : 'arrow'}`;
  iconProps.onClick = rowCount === 0 ? () => addInitialRow() : () => setIsSectionOpen(state => !state);

  return (
    <section className={classes}>
      {heading
        && (
          <header ref={ref}>
            <h2 className={`${baseClass}__heading`}>{heading}</h2>
            <div className={`${baseClass}__controls`}>
              <IconButton
                className={`${baseClass}__collapse__icon ${baseClass}__collapse__icon--${isSectionOpen ? 'open' : 'closed'}`}
                size="small"
                {...iconProps}
              />
            </div>
          </header>
        )}
      {children
        && (
          <AnimateHeight
            className={`${baseClass}__content ${baseClass}__content--is-${isSectionOpen ? 'open' : 'closed'}`}
            height={isSectionOpen ? 'auto' : 0}
            duration={150}
          >
            {children}
          </AnimateHeight>
        )}
    </section>
  );
});

Section.defaultProps = {
  className: '',
  heading: '',
  children: undefined,
};

Section.propTypes = {
  className: PropTypes.string,
  heading: PropTypes.string,
  children: PropTypes.node,
};

export default Section;
