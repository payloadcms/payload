'use client'
import type { TextFieldClientComponent } from 'payload'

import { TextField, useServerFunctions } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

export const CustomClientField: TextFieldClientComponent = (props) => {
  const { serverFunction } = useServerFunctions()

  const [result, setResult] = useState<null | string>(null)

  useEffect(() => {
    const doServerFn = async () => {
      const res = (await serverFunction({
        name: 'my-server-function',
        args: {
          value: 'world!',
        },
      })) as string

      setResult(res)
    }

    void doServerFn()
  }, [serverFunction])

  return (
    <div>
      <div id="server-function-result">
        {!result ? 'Executing Server Function...' : `Server Function result: ${result}`}
      </div>
      <TextField {...props} />
    </div>
  )
}
