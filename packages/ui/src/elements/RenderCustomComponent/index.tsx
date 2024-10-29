type Args = {
  CustomComponent?: React.ReactNode
  Fallback: React.ReactNode
}
export function RenderCustomComponent({ CustomComponent, Fallback }: Args): React.ReactNode {
  if (CustomComponent !== undefined) {
    return CustomComponent
  }

  if (Fallback !== undefined) {
    return Fallback
  }

  return null
}
