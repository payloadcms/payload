import { Modal } from '@faceless-ui/modal'
import React from 'react'

import type { MainMenu } from '../../payload-types'

import { HeaderBar } from '.'
import { Gutter } from '../Gutter'
import { CMSLink } from '../Link'
import classes from './mobileMenuModal.module.scss'

type Props = {
  navItems: MainMenu['navItems']
}

export const slug = 'menu-modal'

export const MobileMenuModal: React.FC<Props> = ({ navItems }) => {
  return (
    <Modal className={classes.mobileMenuModal} slug={slug}>
      <HeaderBar />

      <Gutter>
        <div className={classes.mobileMenuItems}>
          {navItems &&
            navItems.map(({ link }, i) => {
              return <CMSLink className={classes.menuItem} key={i} {...link} />
            })}
        </div>
      </Gutter>
    </Modal>
  )
}
