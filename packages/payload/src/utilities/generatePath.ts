export function generatePath({ name, path = '' }: { name?: string; path?: string }): string {
  if (!name) {
    return path
  }
  return path ? `${path}.${name}` : name
}
