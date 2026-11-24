'use client'

import type { ReactNode } from 'react'

import { Component } from 'react'

/** A broken custom preview must not prevent adding or replacing widgets. */
export class WidgetPreviewErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  override state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  override render() {
    return this.state.hasError ? null : this.props.children
  }
}
