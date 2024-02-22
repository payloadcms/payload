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
