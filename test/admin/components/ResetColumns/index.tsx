'use client'

import { Pill, useTableColumns } from '@payloadcms/ui'

function ResetDefaultColumnsButton() {
  const { resetColumnsState } = useTableColumns()

  return (
    <Pill id="reset-columns-button" onClick={resetColumnsState}>
      Reset to default columns
    </Pill>
  )
}

export { ResetDefaultColumnsButton }
