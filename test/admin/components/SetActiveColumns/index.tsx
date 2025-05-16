'use client'

import { Pill, useTableColumns } from '@payloadcms/ui'

function SetActiveColumnsButton() {
  const { setActiveColumns } = useTableColumns()

  return (
    <Pill id="set-active-columns-button" onClick={() => setActiveColumns(['id'])}>
      Set active columns
    </Pill>
  )
}

export { SetActiveColumnsButton }
