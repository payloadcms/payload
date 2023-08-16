import React from 'react';
import { StepNav } from '../StepNav';
import { Props } from './types';
import { Gutter } from '../Gutter';

import './index.scss';

const baseClass = 'eyebrow';

const Eyebrow: React.FC<Props> = ({ actions }) => (
  <div className={baseClass}>
    <Gutter className={`${baseClass}__wrap`}>
      <StepNav />
      {actions}
    </Gutter>
  </div>
);

export default Eyebrow;
