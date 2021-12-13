import React from 'react';
import ReactSelect from '../../../elements/ReactSelect';
import { Props } from './types';

import './index.scss';

const baseClass = 'select-revision-locales';

const SelectLocales: React.FC<Props> = ({ onChange, value, options }) => (
  <div className={baseClass}>
    <div className={`${baseClass}__label`}>
      Show locales:
    </div>
    <ReactSelect
      isMulti
      placeholder="Select locales to display"
      onChange={onChange}
      value={value}
      options={options}
    />
  </div>
);

export default SelectLocales;
