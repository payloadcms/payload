import React from 'react';
import EditableBlockTitle from './EditableBlockTitle';
import Pill from '../../../elements/Pill';
import { Props } from './types';

import './index.scss';

const baseClass = 'section-title';

const SectionTitle: React.FC<Props> = (props) => {
  const { label, ...remainingProps } = props;

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Pill pillStyle="light-gray">{label}</Pill>
      <EditableBlockTitle {...remainingProps} />
    </div>
  );
};

export default SectionTitle;
