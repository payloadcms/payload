// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { Root } from 'payload/components/root'
// @ts-ignore - need to do this because this file doesn't actually exist
import React from 'react'
import { createRoot } from 'react-dom/client'

const container = document.getElementById('app')
const root = createRoot(container) // createRoot(container!) if you use TypeScript
root.render(<Root />)
