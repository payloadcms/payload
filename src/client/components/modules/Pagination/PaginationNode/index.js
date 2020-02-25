import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'pagination-node';

const PaginationNode = (props) => {
  const {
    pageTo,
    onClick,
    currentPage,
    className,
    children,
    isDisabled,
  } = props;

  const classes = [
    baseClass,
    (currentPage === pageTo) && `${baseClass}--is-active`,
    isDisabled && `${baseClass}--is-disabled`,
    className && className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={onClick && onClick}
    >
      {children || pageTo}
    </button>
  );
};

PaginationNode.defaultProps = {
  isDisabled: false,
  pageTo: null,
  onClick: null,
  className: null,
  children: null,
};

PaginationNode.propTypes = {
  isDisabled: PropTypes.bool,
  currentPage: PropTypes.number.isRequired,
  pageTo: PropTypes.number,
  onClick: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default PaginationNode;
