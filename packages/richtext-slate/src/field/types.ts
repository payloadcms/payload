import type { RichTextPlugin, SlateFieldProps } from '../types.js'

export type EnabledFeatures = {
  elements: {
    [name: string]: {
      Button: React.ReactNode
      Element: React.ReactNode
      name: string
    }
  }
  leaves: {
    [name: string]: {
      Button: React.ReactNode
      Leaf: React.ReactNode
      name: string
    }
  }
  plugins: React.ReactNode[]
}

export type LoadedSlateFieldProps = {
  elements: EnabledFeatures['elements']
  leaves: EnabledFeatures['leaves']
  plugins: RichTextPlugin[]
} & SlateFieldProps
