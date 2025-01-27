import type { PointField } from '../../payload-types'

export const pointDoc: Partial<PointField> = {
  point: [7, -7],
  localized: [15, -12],
  group: { point: [1, 9] },
}
