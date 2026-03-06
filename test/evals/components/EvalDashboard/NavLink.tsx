'use client'

import type { PayloadClientReactComponent, SanitizedConfig } from 'payload'

import { useConfig } from '@payloadcms/ui'
import LinkImport from 'next/link.js'
import React, { useState } from 'react'

import { FlaskIcon } from '../../icons/FlaskIcon.js'
import { ListIcon } from '../../icons/ListIcon.js'

const Link = 'default' in LinkImport ? LinkImport.default : LinkImport

const navItemStyle = (hovered: boolean): React.CSSProperties => ({
  alignItems: 'center',
  background: hovered ? 'var(--theme-elevation-100)' : 'transparent',
  borderRadius: 'var(--style-radius-m)',
  color: 'var(--theme-elevation-800)',
  display: 'flex',
  fontSize: '1.1rem',
  fontWeight: 500,
  gap: '8px',
  padding: '6px 10px',
  textDecoration: 'none',
  transition: 'background 0.15s',
})

function InternalNavItem({
  adminRoute,
  children,
  href,
  icon,
}: {
  adminRoute: string
  children: React.ReactNode
  href: string
  icon: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={`${adminRoute}${href}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={navItemStyle(hovered)}
    >
      {icon}
      {children}
    </Link>
  )
}

function ExternalNavItem({
  children,
  href,
  icon,
}: {
  children: React.ReactNode
  href: string
  icon: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      rel="noopener noreferrer"
      style={navItemStyle(hovered)}
      target="_blank"
    >
      {icon}
      {children}
    </a>
  )
}

export const EvalDashboardNavLink: PayloadClientReactComponent<
  SanitizedConfig['admin']['components']['afterNavLinks'][0]
> = () => {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        marginTop: 'var(--base)',
        padding: '0 var(--nav-padding)',
        width: '100%',
      }}
    >
      <InternalNavItem adminRoute={adminRoute} href="/eval-dashboard" icon={<ListIcon size={20} />}>
        Eval Results
      </InternalNavItem>
      <ExternalNavItem href="/api/eval-report/report.html" icon={<FlaskIcon size={20} />}>
        Vitest Report
      </ExternalNavItem>
    </div>
  )
}
