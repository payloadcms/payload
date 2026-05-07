export const Pages = {
  slug: 'pages',
  select: ({ select }) => (select ? { ...select, title: true, slug: true } : undefined),
  fields: [],
}
