export type Query = {
  where?: {
    and: unknown[],
    [key: string]: unknown
  }
};
