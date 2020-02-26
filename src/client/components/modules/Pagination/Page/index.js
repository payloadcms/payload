import React from 'react';

import './index.scss';

const baseClass = 'paginator__page';

const Page = ({ page, isCurrent, setPage }) => {
  const classes = [
    baseClass,
    isCurrent && `${baseClass}--is-current`,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      onClick={() => setPage(page)}
      type="button"
    >
      {page}
    </button>
  );
};

export default Page;
