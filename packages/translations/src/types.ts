export type Translations = {
  [language: string]:
    | {
        $schema: string
      }
    | {
        [namespace: string]: {
          [key: string]: string
        }
      }
}
