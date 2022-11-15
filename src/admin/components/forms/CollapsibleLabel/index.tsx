import React from 'react';
import { Props } from './types';
import { useWatchForm } from '../Form/context';

export const CollapsibleLabel: React.FC<Props> = (props) => {
  const {
    path,
    fallback,
    label,
    rowNumber,
  } = props;
  const { getDataByPath, getSiblingData, getData } = useWatchForm();
  const formData = getData();
  const collapsibleData = getDataByPath(path) || getSiblingData(path);

  return (
    <React.Fragment>
      {(typeof label === 'function')
        ? label({ collapsibleData, index: rowNumber, formData, fallback })
        : (label || fallback)}
    </React.Fragment>
  );
};
