import * as React from 'react'
import { SelectInput } from '@payloadcms/ui'

export const presidentOptions = [
  {
    label: 'Thomas Jefferson',
    value: '3',
  },
  {
    label: 'James Madison',
    value: '4',
  },
]

export const MyComponent = async (args) => {
  // you would likely want to fetch this data from an API
  // this is just an example of async data "fetching"
  const fetchedPresidents = await Promise.resolve(presidentOptions)

  return (
    <div>
      <label className="field-label">Custom Select</label>
      <SelectInput hasMany={true} path={args.path} options={fetchedPresidents} />
    </div>
  )
}
