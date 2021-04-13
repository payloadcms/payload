import { Data } from '../../forms/Form/types';

export type Props = {
  generatePreviewURL?: (data: unknown, token: string) => string,
  data?: Data
}
