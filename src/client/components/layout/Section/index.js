import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'section';

const Section = (props) => {
  const { className, heading, children } = props;

  const classes = [
    baseClass,
    className && className,
  ].filter(Boolean).join(' ');

  return (
    <section className={classes}>
      {heading
        && (
          <header>
            <h2>{heading}</h2>
          </header>
        )}
      <div className="content">
        {children}
      </div>
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
