declare module '*.svg' {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  import React = require('react')

  export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>
  const src: string
  export default src
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.json' {
  const content: string
  export default content
}
