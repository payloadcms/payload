import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { DefaultFilter } from './index.js'

test('should render a boolean select when the field is not a filter option', async () => {
  const screen = await render(
    <DefaultFilter
      booleanSelect
      disabled
      internalField={undefined}
      onChange={() => {}}
      operator="exists"
      options={[
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
      ]}
      value="false"
    />,
  )

  await expect.element(screen.getByText('False')).toBeInTheDocument()
})
