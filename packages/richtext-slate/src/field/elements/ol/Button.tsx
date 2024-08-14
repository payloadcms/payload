'use client'
import React from 'react'

import { OLIcon } from '../../icons/OrderedList/index.js'
import { ListButton } from '../ListButton.js'

export const OLElementButton = ({ format }: { format: string }) => (
  <ListButton format={format}>
    <OLIcon />
  </ListButton>
)
