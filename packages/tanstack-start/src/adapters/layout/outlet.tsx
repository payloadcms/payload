'use client'

import { Outlet } from '@tanstack/react-router'
import React from 'react'

/** Gives Flight a plain function identity React can match across refreshes, preserving Outlet state and focus. */
export function PayloadOutlet() {
  return <Outlet />
}
