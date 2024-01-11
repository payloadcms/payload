type Args<T = unknown> = {
  path: string
  value?: T
}

export type DescriptionFunction<T = unknown> = (args: Args<T>) => string

export type DescriptionComponent<T = unknown> = React.ComponentType<Args<T>>

export type Description =
  | DescriptionComponent
  | DescriptionFunction
  | Record<string, string>
  | string
