'use client'

import React from 'react'
import { Modal, ModalToggler } from '@faceless-ui/modal'

import { Header } from '../../../payload/payload-types'
import { Gutter } from '../Gutter'
import { CMSLink } from '../Link'

import classes from './mobileMenuModal.module.scss'

type Props = {
  navItems: Header['navItems']
}

export const slug = 'menu-modal'

export const MobileMenuModal: React.FC<Props> = ({ navItems }) => {
  return (
    <Modal slug={slug} className={classes.mobileMenuModal}>
      <Gutter>
        <div className={classes.mobileMenuItems}>
          {navItems?.map(({ link }, i) => {
            return <CMSLink className={classes.menuItem} key={i} {...link} />
          })}
          <ModalToggler
            slug={slug}
            className={[classes.menuItem, classes.close].filter(Boolean).join(' ')}
          >
            Close
          </ModalToggler>
        </div>
      </Gutter>
    </Modal>
  )
}
