'use client'
import React from 'react'

import { ULIcon } from '../../icons/UnorderedList/index.js'
import { ListButton } from '../ListButton.js'

export const ULElementButton = ({ format }: { format: string }) => (
  <ListButton format={format}>
    <ULIcon />
  </ListButton>
)
