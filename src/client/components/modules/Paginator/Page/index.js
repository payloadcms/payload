import React from 'react';
import PropTypes from 'prop-types';

import './index.scss';

const baseClass = 'paginator__page';

const Page = ({
  page, isCurrent, updatePage, isFirstPage, isLastPage,
}) => {
  const classes = [
    baseClass,
    isCurrent && `${baseClass}--is-current`,
    isFirstPage && `${baseClass}--is-first-page`,
    isLastPage && `${baseClass}--is-last-page`,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={() => updatePage(page)}
      type="button"
    >
      {page}
    </button>
  );
};

Page.defaultProps = {
  page: 1,
  isCurrent: false,
  updatePage: null,
  isFirstPage: false,
  isLastPage: false,
};

Page.propTypes = {
  page: PropTypes.number,
  isCurrent: PropTypes.bool,
  updatePage: PropTypes.func,
  isFirstPage: PropTypes.bool,
  isLastPage: PropTypes.bool,
};

export default Page;
