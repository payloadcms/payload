import React from 'react'
import { useTranslation } from 'react-i18next'

import { useConfig } from '../../utilities/Config'
import RenderCustomComponent from '../../utilities/RenderCustomComponent'

const css = `
  .graphic-icon {
    width: 18px;
    height: 18px;
  }

  .graphic-icon path {
    fill: var(--theme-elevation-1000);
  }

  @media (max-width: 768px) {
    .graphic-icon {
      width: 16px;
      height: 16px;
    }
  }
`

const PayloadIcon: React.FC = () => {
  const { t } = useTranslation()

  return (
    <span title={t('general:dashboard')}>
      <svg
        className="graphic-icon"
        height="100%"
        viewBox="0 0 25 25"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{css}</style>
        <path d="M11.5293 0L23 6.90096V19.9978L14.3608 25V11.9032L2.88452 5.00777L11.5293 0Z" />
        <path d="M10.6559 24.2727V14.0518L2 19.0651L10.6559 24.2727Z" />
      </svg>
    </span>
  )
}

const Icon: React.FC = () => {
  const {
    admin: {
      components: {
        graphics: { Icon: CustomIcon } = {
          Icon: undefined,
        },
      } = {},
    } = {},
  } = useConfig()

  return <RenderCustomComponent CustomComponent={CustomIcon} DefaultComponent={PayloadIcon} />
}

export default Icon
