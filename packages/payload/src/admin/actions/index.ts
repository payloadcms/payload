export type PayloadServerActionArgs = {
  action: string
  args: Record<string, unknown>
}

export type PayloadServerAction = (args: PayloadServerActionArgs) => Promise<unknown>
