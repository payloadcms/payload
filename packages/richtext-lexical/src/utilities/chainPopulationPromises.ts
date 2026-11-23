/**
 * Returns a `populationPromises` array that forwards every pushed promise to the original array,
 * chained with `afterPopulate`, so it runs once that population has finished.
 */
export const chainPopulationPromises = ({
  afterPopulate,
  populationPromises,
}: {
  afterPopulate: () => Promise<void>
  populationPromises: Promise<void>[]
}): Promise<void>[] => {
  const chainedPopulationPromises: Promise<void>[] = []

  chainedPopulationPromises.push = (...promises) =>
    populationPromises.push(...promises.map((promise) => promise.then(afterPopulate)))

  return chainedPopulationPromises
}
