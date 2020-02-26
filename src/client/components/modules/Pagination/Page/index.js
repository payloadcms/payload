import React from 'react';

import './index.scss';

const baseClass = 'paginator__page';

const Page = ({ page, isCurrent, updatePage }) => {
  const classes = [
    baseClass,
    isCurrent && `${baseClass}--is-current`,
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

export default Page;
