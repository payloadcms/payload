'use client'
import React from 'react'

import { FieldDescription } from './index.js'

export const meta = {
  description: 'Renders help text below a field to guide users.',
  title: 'Fields / FieldDescription',
}

export const Default = () => (
  <FieldDescription description="Enter a unique title for this document." path="title" />
)

export const LongDescription = () => (
  <FieldDescription
    description="This field accepts plain text only. Markdown and HTML are not supported. Maximum 200 characters."
    path="content"
  />
)

export const WithMarginTop = () => (
  <FieldDescription
    description="This description appears with top margin spacing."
    marginPlacement="top"
    path="example"
  />
)

export const WithMarginBottom = () => (
  <FieldDescription
    description="This description appears with bottom margin spacing."
    marginPlacement="bottom"
    path="example"
  />
)
