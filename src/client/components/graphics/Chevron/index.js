import React from 'react';
import PropTypes from 'prop-types';

const baseClass = 'chevron';

const Chevron = ({ isOpen, className }) => {
  const classes = [
    'icon',
    baseClass,
    className && className,
    isOpen && `${baseClass}--is-${isOpen ? 'open' : 'closed'}`,
  ].filter(Boolean).join(' ');

  return (
    <svg
      className={classes}
      width="21px"
      height="10px"
      viewBox="0 0 21 10"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
        strokeLinecap="square"
      >
        <g transform="translate(10.146447, 9.267767) rotate(45.000000) translate(-10.146447, -9.267767) translate(3.146447, 2.267767)">
          <line
            className="stroke"
            x1="1"
            y1="0.5"
            x2="14"
            y2="0.5"
          />
          <line
            className="stroke"
            x1="1"
            y1="0.5"
            x2="1"
            y2="13.5"
          />
        </g>
      </g>
    </svg>
  );
};

Chevron.defaultProps = {
  isOpen: false,
  className: '',
};

Chevron.propTypes = {
  isOpen: PropTypes.bool,
  className: PropTypes.string,
};

export default Chevron;
