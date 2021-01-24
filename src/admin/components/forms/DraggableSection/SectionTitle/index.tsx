import React from 'react';
import useFieldType from '../../useFieldType';
import Pill from '../../../elements/Pill';
import { Props } from './types';

import './index.scss';

const baseClass = 'section-title';

const SectionTitle: React.FC<Props> = (props) => {
  const { label, path, readOnly } = props;

  const { value, setValue } = useFieldType({ path });

  const classes = [
    baseClass,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <Pill
        pillStyle="light-gray"
        className={`${baseClass}__pill`}
      >
        {label}
      </Pill>

      <input
        className={`${baseClass}__input`}
        id={path}
        value={value as string || ''}
        placeholder="Untitled"
        type="text"
        name={path}
        onChange={setValue}
        readOnly={readOnly}
      />
    </div>
  );
};

export default SectionTitle;
