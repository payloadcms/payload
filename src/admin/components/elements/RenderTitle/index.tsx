import React, { Fragment } from 'react';
import { Props } from './types';
import useTitle from '../../../hooks/useTitle';

import './index.scss';

const baseClass = 'render-title';

const RenderTitle : React.FC<Props> = (props) => {
  const {
    useAsTitle,
    title: titleFromProps,
    data,
    fallback = '[untitled]',
  } = props;

  const titleFromForm = useTitle(useAsTitle);
  const titleFromData = data && data[useAsTitle];

  let title = titleFromData;
  if (!title) title = titleFromForm;
  if (!title) title = data?.id;
  if (!title) title = fallback;
  title = titleFromProps || title;

  const idAsTitle = title === data?.id;

  const classes = [
    baseClass,
    idAsTitle && `${baseClass}--id-as-title`,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {idAsTitle && (
        <Fragment>
          ID:&nbsp;&nbsp;
        </Fragment>
      )}
      {title}
    </span>
  );
};

export default RenderTitle;
