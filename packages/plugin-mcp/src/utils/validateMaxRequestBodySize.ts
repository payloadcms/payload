export const validateMaxRequestBodySize = ({ value }: { value?: number }): void => {
  if (value !== undefined && (!Number.isFinite(value) || value <= 0)) {
    throw new RangeError('mcp.maxRequestBodySize must be a positive, finite number of bytes.')
  }
}
