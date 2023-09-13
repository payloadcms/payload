export const formatMonth = (dateRaw: string): string => {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

  const formattedDate = formatter.format(new Date(dateRaw))
  return formattedDate
}

export const formatYear = (dateRaw: string): string => {
  const formatter = new Intl.DateTimeFormat('en-US', { year: 'numeric' })

  const formattedDate = formatter.format(new Date(dateRaw))
  return formattedDate
}
