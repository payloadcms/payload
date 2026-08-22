/**
 * Mutable hook sink, so tests can observe which document hooks merge fires
 * without rebuilding the config.
 */
export const hookSpy: {
  afterChange?: (args: any) => void
  beforeChange?: (args: any) => void
} = {}
