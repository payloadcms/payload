import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';
import Chevron from '../../graphics/Chevron';

import './index.scss';

const baseClass = 'section';

const Section = (props) => {
  const {
    className, heading, children,
  } = props;

  const classes = [
    baseClass,
    className && className,
  ].filter(Boolean).join(' ');

  const [isSectionOpen, setIsSectionOpen] = useState(true);

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

            <Chevron isOpen={isSectionOpen} />
          </header>
        )}
      {children
        && (
          <AnimateHeight
            className={`${baseClass}__content ${baseClass}__content--is-${isSectionOpen ? 'open' : 'closed'}`}
            height={isSectionOpen ? 'auto' : 0}
            duration={0}
          >
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
};

Section.propTypes = {
  className: PropTypes.string,
  heading: PropTypes.string,
  children: PropTypes.node,
};

export default Section;
