export const shouldRefreshTenantSelection = ({
  initialValue,
  tenantCookie,
}: {
  initialValue?: number | string
  tenantCookie?: string
}): boolean => !initialValue && Boolean(tenantCookie)
