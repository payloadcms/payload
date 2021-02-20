import { Data } from "../../forms/Form/types";

export type GeneratedPreviewURL = {
  url: string,
  newTab: boolean
}

export type Props = {
  generatePreviewURL?: (data: unknown, token: string) => GeneratedPreviewURL,
  data?: Data
}
