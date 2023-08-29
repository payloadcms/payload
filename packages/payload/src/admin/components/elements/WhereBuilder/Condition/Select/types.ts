import type { Option } from '../../../../../../fields/config/types.js';
import type { Operator } from '../../../../../../types/index.js';

export type Props = {
  onChange: (val: string) => void,
  operator: Operator
  options: Option[]
  value: string,
}
