export type Props = {
  enableColumns: boolean,
  enableSort: boolean,
  setSort: () => void,
  collection: {
    admin: {
      useAsTitle: string,
      defaultColumns: string[],
    },
    fields: []
  }
  handleChange: () => void,
}
