'use client'

import { Banner, PopupList } from '@payloadcms/ui'

export const ListMenuItemsExample = () => {
  return (
    <>
      <PopupList.ButtonGroup>
        <Banner>listMenuItems</Banner>
        <Banner>Many of them</Banner>
        <Banner>Ok last one</Banner>
      </PopupList.ButtonGroup>
    </>
  )
}
