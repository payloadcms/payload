import { render } from '@testing-library/react'
import React from 'react'

import Separator from './Paginator/Separator'

describe('Elements', () => {
  describe('Paginator', () => {
    it('separator - renders dash', () => {
      const { getByText } = render(<Separator />)
      const linkElement = getByText(/—/) // &mdash;
      expect(linkElement).toBeInTheDocument()
    })
  })
})
