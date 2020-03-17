import React, { useState } from 'react';
import PropTypes from 'prop-types';
import AnimateHeight from 'react-animate-height';

import './index.scss';
import IconButton from '../../controls/IconButton';

const baseClass = 'section';

const Section = (props) => {
  const { className, heading, children } = props;

  const classes = [
    baseClass,
    className && className,
  ].filter(Boolean).join(' ');

  const [isSectionOpen, setIsSectionOpen] = useState(true);

  return (
    <section className={classes}>
      {heading
        && (
          <header>
            <h2 className={`${baseClass}__heading`}>{heading}</h2>
            <div className={`${baseClass}__controls`}>
              <IconButton
                className={`${baseClass}__collapse__icon ${baseClass}__collapse__icon--${isSectionOpen ? 'open' : 'closed'}`}
                iconName="arrow"
                size="small"
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
            <div>
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
};

Section.propTypes = {
  className: PropTypes.string,
  heading: PropTypes.string,
  children: PropTypes.node,
};

export default Section;
