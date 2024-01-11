import React from 'react'

import type { Props } from './types'

import { Gutter } from '../Gutter'
import StepNav from '../StepNav'
import './index.scss'

const baseClass = 'eyebrow'

const Eyebrow: React.FC<Props> = () => (
  <div className={baseClass}>
    <Gutter className={`${baseClass}__wrap`}>
      <StepNav />
    </Gutter>
  </div>
)

export default Eyebrow
