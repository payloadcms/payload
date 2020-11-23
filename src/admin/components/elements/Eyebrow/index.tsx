import React from 'react';
import StepNav from '../StepNav';
import { Props } from './types';

import './index.scss';

const baseClass = 'eyebrow';

const Eyebrow: React.FC<Props> = ({ actions }) => (
  <div className={baseClass}>
  <StepNav />
    {actions}
  </div>
);

export default Eyebrow;
