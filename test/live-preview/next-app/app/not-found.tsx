'use client'

import React from 'react'

import { Gutter } from './_components/Gutter'
import { VerticalPadding } from './_components/VerticalPadding'

export default function NotFound() {
  return (
    <main>
      <VerticalPadding bottom="medium" top="none">
        <Gutter>
          <h1>404</h1>
          <p>This page could not be found.</p>
        </Gutter>
      </VerticalPadding>
    </main>
  )
}
