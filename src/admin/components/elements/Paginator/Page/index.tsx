import React from 'react';
import { Props } from './types';

const baseClass = 'paginator__page';

const Page: React.FC<Props> = ({
  page,
  isCurrent,
  updatePage,
  isFirstPage,
  isLastPage,
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

export default Page;
