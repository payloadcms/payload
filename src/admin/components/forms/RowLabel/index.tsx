import React from 'react';
import { isComponent, Props } from './types';
import { useWatchForm } from '../Form/context';

const baseClass = 'row-label';

export const RowLabel: React.FC<Props> = (props) => {
  const {
    path,
    fallback,
    label,
    rowNumber,
    className,
  } = props;

  const { getDataByPath, getSiblingData } = useWatchForm();
  const collapsibleData = getSiblingData(path);
  const arrayData = getDataByPath(path);
  const data = arrayData || collapsibleData;

  if (isComponent(label)) {
    const Label = label;
    return (
      <Label
        data={data}
        path={path}
        fallback={fallback}
        index={rowNumber}
      />
    );
  }

  if (label) {
    return (
      <span
        className={[
          baseClass,
          className,
        ].filter(Boolean).join(' ')}
      >
        {typeof label === 'function' ? label({
          data,
          path,
          fallback,
          index: rowNumber,
        }) : label}
      </span>
    );
  }

  if (fallback) {
    return (
      <React.Fragment>
        {fallback}
      </React.Fragment>
    );
  }

  return null;
};
