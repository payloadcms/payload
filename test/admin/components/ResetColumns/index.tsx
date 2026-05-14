'use client'

import { Button, useTableColumns } from '@payloadcms/ui'

function ResetDefaultColumnsButton() {
  const { resetColumnsState } = useTableColumns()

  return (
    <Button buttonStyle="pill" id="reset-columns-button" onClick={resetColumnsState} size="medium">
      Reset to default columns
    </Button>
  )
}

export { ResetDefaultColumnsButton }
