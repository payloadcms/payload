export const generateAdminURL = (path: string, adminRoute: string, serverURL?: string): string => {
  let url = path

  if (adminRoute && adminRoute !== '/') {
    url = `${adminRoute}${url}`
  }

  return `${serverURL}${url}`
}
