import React from 'react';
import StepNav from '../StepNav.js';
import { Props } from './types.js';
import { Gutter } from '../Gutter.js';

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
