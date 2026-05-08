'use client'
import React from 'react'

import { Button } from './index.js'

export const meta = {
  description:
    'Primary action trigger used throughout the admin panel for forms, dialogs, and navigation.',
  title: 'Elements / Button',
}

export const Primary = () => <Button buttonStyle="primary">Save changes</Button>

export const Secondary = () => <Button buttonStyle="secondary">Cancel</Button>

export const Subtle = () => <Button buttonStyle="subtle">View details</Button>

export const Destructive = () => <Button buttonStyle="destructive">Delete document</Button>

export const Ghost = () => <Button buttonStyle="ghost">Ghost action</Button>

export const Disabled = () => (
  <Button buttonStyle="primary" disabled>
    Disabled
  </Button>
)

export const Large = () => (
  <Button buttonStyle="primary" size="large">
    Large button
  </Button>
)

export const WithIcon = () => (
  <Button buttonStyle="primary" icon="plus">
    Add item
  </Button>
)
