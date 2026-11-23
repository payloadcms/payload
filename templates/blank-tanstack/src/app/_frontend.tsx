/// <reference types="vite/client" />

import { createFileRoute, Outlet } from '@tanstack/react-router'

import styles from './_frontend/styles.css?url'

export const Route = createFileRoute('/_frontend')({
  component: FrontendLayout,
  head: () => ({
    links: [{ rel: 'stylesheet', href: styles }],
  }),
})

function FrontendLayout() {
  return <Outlet />
}
