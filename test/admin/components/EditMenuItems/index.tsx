'use client'

import { Banner, PopupList } from '@payloadcms/ui'

export const EditMenuItems = () => {
  return (
    <>
      <PopupList.ButtonGroup>
        <PopupList.Button>Custom Edit Menu Item</PopupList.Button>
        <Banner>Another using a banner</Banner>
        <div>Another in a plain div</div>
      </PopupList.ButtonGroup>
    </>
  )
}
