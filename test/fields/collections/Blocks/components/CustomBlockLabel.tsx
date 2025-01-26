import type { BlockRowLabelServerComponent } from 'payload'

const CustomBlockLabel: BlockRowLabelServerComponent = ({ rowLabel }) => {
  return <div>{`Custom Block Label: ${rowLabel}`}</div>
}

export default CustomBlockLabel
