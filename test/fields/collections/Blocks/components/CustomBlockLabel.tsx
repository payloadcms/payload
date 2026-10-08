import type { BlockRowLabelServerProps } from 'payload'
import type React from 'react'

const CustomBlockLabel: React.FC<BlockRowLabelServerProps> = ({ rowLabel }) => {
  return <div>{`Custom Block Label: ${rowLabel}`}</div>
}

export default CustomBlockLabel
