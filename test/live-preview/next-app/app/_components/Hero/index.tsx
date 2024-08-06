import React from 'react'

import { Page } from '../../../payload-types'
import { HighImpactHero } from '../../_heros/HighImpact'
import { LowImpactHero } from '../../_heros/LowImpact'

const heroes = {
  highImpact: HighImpactHero,
  lowImpact: LowImpactHero,
}

export type HeroProps = Page['hero']

export const Hero = (props: HeroProps) => {
  const { type } = props || {}

  if (!type || type === 'none') return null

  const HeroToRender = heroes[type]

  if (!HeroToRender) return null

  return <HeroToRender {...props} />
}
