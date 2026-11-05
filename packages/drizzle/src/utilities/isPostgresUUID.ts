/**
 * Whether a value can be bound to a `uuid` column without the database rejecting it.
 *
 * Postgres only requires the `8-4-4-4-12` hexadecimal form: it does not inspect the version
 * nibble or the variant bits, so an identifier that no RFC 4122 validator accepts - a
 * SQL Server `NEWSEQUENTIALID()` value carried over from Dynamics/Dataverse, for one - is
 * still a perfectly storable and queryable `uuid`.
 *
 * This is deliberately looser than `validate` from the `uuid` package, which enforces
 * version and variant. Queries must be guarded against the *format* error Postgres raises,
 * not against a specification the column never applied.
 */
export const isPostgresUUID = (value: unknown): boolean =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
