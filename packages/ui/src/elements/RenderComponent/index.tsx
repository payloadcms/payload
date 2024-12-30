import React from 'react'

export const RenderComponent: React.FC<{
  readonly Component?: React.ComponentType | React.ComponentType[]
  readonly Fallback?: React.ComponentType
  readonly props?: object
}> = ({ Component, Fallback, props = {} }) => {
  if (Array.isArray(Component)) {
    return Component.map((c, index) => <RenderComponent Component={c} key={index} props={props} />)
  }

  if (typeof Component === 'function') {
    return <Component {...props} />
  }

  return Fallback ? <Fallback {...props} /> : null
}
