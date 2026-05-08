'use client'
import React from 'react'

import { Banner } from './index.js'

export const meta = {
  description: 'Contextual notification banner for displaying status messages.',
  title: 'Elements / Banner',
}

export const Default = () => <Banner type="default">This is a default banner message.</Banner>

export const Info = () => <Banner type="info">Your changes have been saved successfully.</Banner>

export const Success = () => <Banner type="success">Document published successfully.</Banner>

export const Error = () => (
  <Banner type="error">An error occurred while saving. Please try again.</Banner>
)
