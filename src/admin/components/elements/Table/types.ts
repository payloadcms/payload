export type Props = {
  columns: {
      accessor: string,
      components: {
        Heading: React.ReactNode,
        renderCell: () => void,
      },
    }[],
  data: []
}
