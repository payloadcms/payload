import React from 'react'

import type { Page } from '../../../../../payload-types.js'

import { HighImpactHero } from '../../_heros/HighImpact/index.js'
import { LowImpactHero } from '../../_heros/LowImpact/index.js'

const heroes = {
  highImpact: HighImpactHero,
  lowImpact: LowImpactHero,
}

export const Hero: React.FC<Page['hero']> = (props) => {
  const { type } = props || {}

  if (!type || type === 'none') return null

  const HeroToRender = heroes[type]

  if (!HeroToRender) return null

  return <HeroToRender {...props} />
}
