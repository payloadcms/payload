import { Data } from "../../forms/Form/types";

export type Props = {
  generatePreviewURL?: (fields: unknown, token: string) => string,
  data?: Data
}
