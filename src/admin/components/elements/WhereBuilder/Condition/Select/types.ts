import { Operator } from '../../../../../../types';
import { Option } from '../../../../../../fields/config/types';

export type Props = {
  onChange: (val: string) => void,
  value: string,
  options: Option[]
  operator: Operator
}
