// useBaseListFilter not nested inside a collections property — should be left alone
const unrelated = {
  useBaseListFilter: false,
}

export const config = {
  plugins: [
    {
      collections: {
        posts: {
          useTenantAccess: false,
        },
      },
    },
  ],
}
