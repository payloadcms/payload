import type React from 'react'

import { PayloadLogo } from '../../graphics/Logo/index.js'

export type LogoProps = {
  customLogo?: React.ReactNode
}

export const Logo: React.FC<LogoProps> = ({ customLogo }) => {
  return customLogo ?? <PayloadLogo />
}
