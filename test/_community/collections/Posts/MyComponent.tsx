import React from 'react'

import { SelectInput } from '@payloadcms/ui'

export const MyComponent: React.FC = () => {
  return (
    <SelectInput
      options={[
        {
          label: 'group1',
          options: [
            {
              label: 'Group-1 Item-1',
              value: 'group1Item1',
            },
          ],
        },
        {
          label: 'group2',
          options: [
            {
              label: 'Group-2 Item-1',
              value: 'group2Item1',
            },
          ],
        },
      ]}
      path="customSelect"
      name="customSelect"
    />
  )
}
