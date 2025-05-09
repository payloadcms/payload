'use client'

import { Pill, useTableColumns } from '@payloadcms/ui'

function SetColumnsButton() {
  const { setColumns } = useTableColumns()

  return (
    <Pill id="set-columns-button" onClick={() => setColumns(['id', 'title'])}>
      Set columns
    </Pill>
  )
}

export { SetColumnsButton }
