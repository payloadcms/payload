'use client'
import React, { Fragment } from 'react'

/** @internal */
export function IDCell({ id }: { id: number | string }) {
  return <Fragment>{id}</Fragment>
}
