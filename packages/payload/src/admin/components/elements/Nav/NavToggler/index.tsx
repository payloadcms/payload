import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSidebar } from '../context'
import Hamburger from '../../Hamburger'

import './index.scss'

const baseClass = 'nav-toggler'

export const NavToggler: React.FC = () => {
  const { t } = useTranslation('general')

  const { sidebarOpen, setSidebarOpen } = useSidebar()

  return (
    <button
      type="button"
      className={baseClass}
      aria-label={t('menu')}
      onClick={() => setSidebarOpen(!sidebarOpen)}
    >
      <Hamburger isActive={sidebarOpen} />
    </button>
  )
}
