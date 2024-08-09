import type { MappedComponent } from 'payload'

import type { RichTextPlugin, SlateFieldProps } from '../types.js'

export type EnabledFeatures = {
  elements: {
    [name: string]: {
      Button: MappedComponent
      Element: MappedComponent
      name: string
    }
  }
  leaves: {
    [name: string]: {
      Button: MappedComponent
      Leaf: MappedComponent
      name: string
    }
  }
  plugins: MappedComponent[]
}

export type LoadedSlateFieldProps = {
  elements: EnabledFeatures['elements']
  leaves: EnabledFeatures['leaves']
  plugins: RichTextPlugin[]
} & SlateFieldProps
