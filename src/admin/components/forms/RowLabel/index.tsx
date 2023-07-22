import React from 'react';
import { useTranslation } from 'react-i18next';
import { isComponent, Props } from './types';
import { useWatchForm } from '../Form/context';
import { getTranslation } from '../../../../utilities/getTranslation';

const baseClass = 'row-label';

export const RowLabel: React.FC<Props> = ({ className, ...rest }) => {
  return (
    <span
      style={{
        pointerEvents: 'none',
      }}
      className={[
        baseClass,
        className,
      ].filter(Boolean).join(' ')}
    >
      <RowLabelContent {...rest} />
    </span>
  );
};

const RowLabelContent: React.FC<Omit<Props, 'className'>> = (props) => {
  const {
    path,
    label,
    rowNumber,
  } = props;

  const { i18n } = useTranslation();
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
        index={rowNumber}
      />
    );
  }

  return (
    <React.Fragment>
      {typeof label === 'function' ? label({
        data,
        path,
        index: rowNumber,
      }) : getTranslation(label, i18n)}
    </React.Fragment>
  );
};
