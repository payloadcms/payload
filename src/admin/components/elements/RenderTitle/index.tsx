import React from 'react';
import { Props } from './types';
import useTitle from '../../../hooks/useTitle';
import IDLabel from '../IDLabel';

const baseClass = 'render-title';

const RenderTitle: React.FC<Props> = (props) => {
  const {
    useAsTitle,
    collection,
    title: titleFromProps,
    data,
    fallback = '[untitled]',
  } = props;
  const titleFromForm = useTitle(useAsTitle, collection);

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
