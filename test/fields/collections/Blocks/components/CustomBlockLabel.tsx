import type { BlockRowLabelServerComponent } from 'payload'

const CustomBlockLabel: BlockRowLabelServerComponent = ({ rowLabel }) => {
  return <div>{`Custom Label: ${rowLabel}`}</div>
}

export default CustomBlockLabel
