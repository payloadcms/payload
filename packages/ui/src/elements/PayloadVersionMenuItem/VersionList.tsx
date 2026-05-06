'use client'

import React from 'react'

export const VersionList: React.FC<{
  versions: Record<string, string>
}> = ({ versions }) => {
  const ordered = [
    ['payload', versions.payload],
    ...Object.entries(versions)
      .filter(([k]) => k !== 'payload')
      .sort(([a], [b]) => a.localeCompare(b)),
  ].filter(([, v]) => Boolean(v)) as Array<[string, string]>

  return (
    <dl className="payload-version-menu-item__list">
      {ordered.map(([name, version]) => (
        <div className="payload-version-menu-item__row" key={name}>
          <dt>{name}</dt>
          <dd>{version}</dd>
        </div>
      ))}
    </dl>
  )
}
