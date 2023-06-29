import React from 'react'
import { Modal } from '@faceless-ui/modal'

import { Header } from '../../payload-types'
import { Gutter } from '../Gutter'
import { CMSLink } from '../Link'

import classes from './mobileMenuModal.module.scss'

type Props = {
  navItems: Header['navItems']
}

export const slug = 'menu-modal'

export const MobileMenuModal: React.FC<Props> = ({ navItems }) => {
  const hasNavItems = Array.isArray(navItems) && navItems.length > 0
  return (
    <Modal slug={slug} className={classes.mobileMenuModal}>
      <Gutter>
        <div className={classes.mobileMenuItems}>
          {hasNavItems &&
            navItems.map(({ link }, i) => {
              return <CMSLink className={classes.menuItem} key={i} {...link} />
            })}
        </div>
      </Gutter>
    </Modal>
  )
}
