/** Remove submitted top-level operators without traversing nested field values. */
export const sanitizeUpdateData = <T extends Record<string, unknown>>({ data }: { data: T }): T => {
  for (const key of Object.keys(data)) {
    if (key.startsWith('$')) {
      delete data[key]
    }
  }

  return data
}
