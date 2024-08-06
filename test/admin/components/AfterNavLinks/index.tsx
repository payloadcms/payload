import React from 'react'
import { NavLink } from 'react-router-dom'

// As this is the demo project, we import our dependencies from the `src` directory.
import { useConfig } from '../../../../packages/payload/src/admin/components/utilities/Config'

// In your projects, you can import as follows:
// import { useConfig } from 'payload/components/utilities';

const baseClass = 'after-nav-links'

const AfterNavLinks = () => {
  const {
    routes: { admin: adminRoute },
  } = useConfig()

  return (
    <div
      className={baseClass}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--base) / 4)',
      }}
    >
      <h4 className="nav__label" style={{ color: 'var(--theme-elevation-400)', margin: 0 }}>
        Custom Routes
      </h4>
      <h4 className="nav__link" style={{ margin: 0 }}>
        <NavLink
          activeClassName="active"
          style={{ textDecoration: 'none' }}
          to={`${adminRoute}/custom-default-view`}
        >
          Default Template
        </NavLink>
      </h4>
      <h4 className="nav__link" style={{ margin: 0 }}>
        <NavLink
          activeClassName="active"
          style={{ textDecoration: 'none' }}
          to={`${adminRoute}/custom-minimal-view`}
        >
          Minimal Template
        </NavLink>
      </h4>
      <div id="custom-css" />
    </div>
  )
}

export default AfterNavLinks
