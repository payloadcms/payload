import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';

import './index.scss';
import IconButton from '../../controls/IconButton';
import Button from '../../controls/Button';

const baseClass = 'section';

const Section = (props) => {
  const {
    className, heading, children, rowCount, addRow, useAddRowButton,
  } = props;

  const classes = [
    baseClass,
    className && className,
  ].filter(Boolean).join(' ');

  const [isSectionOpen, setIsSectionOpen] = useState(true);

  const addInitialRow = () => {
    addRow();
    setIsSectionOpen(true);
  };

  return (
    <section className={classes}>
      {heading
        && (
          <header
            className={`${baseClass}__collapsible-header`}
            onClick={() => setIsSectionOpen(state => !state)}
            role="button"
            tabIndex={0}
          >
            <h2 className={`${baseClass}__heading`}>{heading}</h2>
          </header>
        )}
      {children
        && (
          <AnimateHeight
            className={`${baseClass}__content ${baseClass}__content--is-${isSectionOpen ? 'open' : 'closed'}`}
            height={isSectionOpen ? 'auto' : 0}
            duration={0}
          >
              {(rowCount === 0 && useAddRowButton)
                && (
                  <div className={`${baseClass}__add-button-wrap`}>
                    <Button
                      onClick={addInitialRow}
                      type="secondary"
                    >
                      Add Row
                    </Button>
                  </div>
                )}
            {children}
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
  useAddRowButton: false,
};

Section.propTypes = {
  className: PropTypes.string,
  heading: PropTypes.string,
  children: PropTypes.node,
  rowCount: PropTypes.number,
  addRow: PropTypes.func,
  useAddRowButton: PropTypes.bool,
};

export default Section;
