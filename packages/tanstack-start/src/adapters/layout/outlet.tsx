'use client'

import { Outlet } from '@tanstack/react-router'
import React from 'react'

/** Keeps the memoized router Outlet local so refreshed Flight models preserve its subtree. */
export function PayloadOutlet() {
  return <Outlet />
}
