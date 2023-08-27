import { Operator } from '../../../../../../types/index.js';
import { Option } from '../../../../../../fields/config/types.js';

export type Props = {
  onChange: (val: string) => void,
  value: string,
  options: Option[]
  operator: Operator
}
