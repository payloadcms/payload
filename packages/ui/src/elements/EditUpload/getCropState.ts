import type { UploadEdits } from 'payload'

const defaultCrop: NonNullable<UploadEdits['crop']> = {
  height: 100,
  unit: '%',
  width: 100,
  x: 0,
  y: 0,
}

export const getCropState = (
  initialCrop?: UploadEdits['crop'],
): NonNullable<UploadEdits['crop']> => ({
  ...defaultCrop,
  ...(initialCrop || {}),
})
