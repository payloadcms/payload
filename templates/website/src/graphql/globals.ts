import { LINK_FIELDS } from './link'

export const GLOBALS = `
  query {
    Header {
      navItems {
        link ${LINK_FIELDS({ disableAppearance: true })}
      }
    }

    Footer {
      navItems {
        link ${LINK_FIELDS({ disableAppearance: true })}
      }
    }
  }
`
