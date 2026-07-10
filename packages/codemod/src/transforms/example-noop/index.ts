import type { Transform } from '../../types.js'

export const exampleNoop: Transform = {
  name: 'example-noop',
  apply: () => ({ filesChanged: [] }),
  description: 'Reference transform. Does nothing. Remove once the first real transform ships.',
}
