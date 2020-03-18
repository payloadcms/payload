import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';

import './index.scss';
import IconButton from '../../controls/IconButton';

const baseClass = 'section';

const Section = (props) => {
  const {
    className, heading, children, rowCount, addRow, useAddRowButton, shouldCalcContentHeight,
  } = props;

  const classes = [
    baseClass,
    className && className,
  ].filter(Boolean).join(' ');

  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(null);
  const [isSectionOpen, setIsSectionOpen] = useState(false);

  useEffect(() => {
    if (shouldCalcContentHeight) setContentHeight(contentRef.current.offsetHeight);
    else setContentHeight(null);
  }, [shouldCalcContentHeight]);

  const addInitialRow = () => {
    addRow();
    setIsSectionOpen(true);
  };

  return (
    <section className={classes}>
      {heading
        && (
          <header>
            <h2 className={`${baseClass}__heading`}>{heading}</h2>
            <div className={`${baseClass}__controls`}>
              {(rowCount === 0 && useAddRowButton)
                && (
                  <IconButton
                    className={`${baseClass}__add-row-button`}
                    size="small"
                    iconName="crosshair"
                    onClick={() => addInitialRow()}
                  />
                )}
              <IconButton
                className={`${baseClass}__collapse-icon ${baseClass}__collapse-icon--${isSectionOpen ? 'open' : 'closed'}`}
                size="small"
                iconName="arrow"
                onClick={() => setIsSectionOpen(state => !state)}
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
            <div
              ref={contentRef}
              style={{
                height: shouldCalcContentHeight && `${contentHeight}px`,
              }}
            >
              {children}
            </div>
          </AnimateHeight>
        )}
    </section>
  );
};

Section.defaultProps = {
  className: '',
  heading: '',
  children: undefined,
  rowCount: 0,
  addRow: undefined,
  shouldCalcContentHeight: false,
  useAddRowButton: false,
};

Section.propTypes = {
  className: PropTypes.string,
  heading: PropTypes.string,
  children: PropTypes.node,
  rowCount: PropTypes.number,
  addRow: PropTypes.func,
  shouldCalcContentHeight: PropTypes.bool,
  useAddRowButton: PropTypes.bool,
};

export default Section;
