import React from 'react';

import type { Props } from './types.js';

import useTitle from '../../../hooks/useTitle.js';
import IDLabel from '../IDLabel/index.js';

const baseClass = 'render-title';

const RenderTitle: React.FC<Props> = (props) => {
  const {
    collection,
    data,
    fallback = '[untitled]',
    title: titleFromProps,
  } = props;
  const titleFromForm = useTitle(collection);

  let title = titleFromForm;
  if (!title) title = data?.id;
  if (!title) title = fallback;
  title = titleFromProps || title;

  const idAsTitle = title === data?.id;

  if (idAsTitle) {
    return (
      <IDLabel id={data?.id} />
    );
  }

  return (
    <span className={baseClass}>
      {title}
    </span>
  );
};

export default RenderTitle;
