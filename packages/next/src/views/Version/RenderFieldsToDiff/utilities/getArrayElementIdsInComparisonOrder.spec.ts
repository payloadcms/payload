import { getArrayElementIdsInComparisonOrder } from './getArrayElementIdsInComparisonOrder.ts'

describe('getArrayElementIdsInComparisonOrder', () => {
  it('handles new value at the end', () => {
    const newArray = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const oldArray = [{ id: 1 }, { id: 2 }]

    const result = getArrayElementIdsInComparisonOrder(newArray, oldArray)

    expect(result).toEqual([1, 2, 3])
  })

  it('handles new value in the middle', () => {
    const newArray = [{ id: 3 }, { id: 15 }, { id: 1 }]
    const oldArray = [{ id: 3 }, { id: 1 }]

    const result = getArrayElementIdsInComparisonOrder(newArray, oldArray)

    expect(result).toEqual([3, 15, 1])
  })

  it('handles moved value', () => {
    const newArray = [{ id: 'a' }, { id: 'c' }, { id: 'b' }]
    const oldArray = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

    const result = getArrayElementIdsInComparisonOrder(newArray, oldArray)

    expect(result).toEqual(['a', 'c', 'b'])
  })

  it('handles removed values at the beginning', () => {
    const newArray = [{ id: 2 }, { id: 3 }, { id: 4 }]
    const oldArray = [{ id: 1 }, { id: 2 }]

    const result = getArrayElementIdsInComparisonOrder(newArray, oldArray)

    expect(result).toEqual([1, 2, 3, 4])
  })

  it('handles removed value in the middle', () => {
    const newArray = [{ id: 'b2' }, { id: 'b5' }]
    const oldArray = [{ id: 'b2' }, { id: 'b3' }, { id: 'b4' }, { id: 'b5' }]

    const result = getArrayElementIdsInComparisonOrder(newArray, oldArray)

    expect(result).toEqual(['b2', 'b3', 'b4', 'b5'])
  })

  it('handles removed values at the end', () => {
    const newArray = [{ id: 'a20' }]
    const oldArray = [{ id: 'a20' }, { id: 'a21' }, { id: 'a22' }, { id: 'a66' }]

    const result = getArrayElementIdsInComparisonOrder(newArray, oldArray)

    expect(result).toEqual(['a20', 'a21', 'a22', 'a66'])
  })

  it('handles cases with new values and removed values in the same spot in the middle', () => {
    let result = getArrayElementIdsInComparisonOrder([{ id: 1 }, { id: 2 }], [{ id: 1 }, { id: 3 }])
    expect(result).toEqual([1, 2, 3])

    result = getArrayElementIdsInComparisonOrder(
      [{ id: 1 }, { id: 2 }, { id: 4 }],
      [{ id: 1 }, { id: 3 }, { id: 4 }],
    )
    expect(result).toEqual([1, 2, 3, 4])
  })

  it('handles complex scenario with multiple changes', () => {
    const newArray = [
      { id: 1 },
      { id: 3 },
      { id: 2 },
      { id: 7 },
      { id: 8 },
      { id: 4 },
      { id: 9 },
      { id: 10 },
    ]
    const oldArray = [
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 },
      { id: 6 },
      { id: 8 },
      { id: 9 },
    ]

    const result = getArrayElementIdsInComparisonOrder(newArray, oldArray)

    expect(result).toEqual([1, 3, 2, 7, 8, 4, 5, 6, 9, 10])
  })

  it('handles empty arrays', () => {
    // Empty newArray, non-empty oldArray
    let result = getArrayElementIdsInComparisonOrder([], [{ id: 1 }, { id: 2 }])
    expect(result).toEqual([1, 2])

    // Non-empty newArray, empty oldArray
    result = getArrayElementIdsInComparisonOrder([{ id: 1 }, { id: 2 }], [])
    expect(result).toEqual([1, 2])

    // Both arrays empty
    result = getArrayElementIdsInComparisonOrder([], [])
    expect(result).toEqual([])
  })

  it('handles arrays with different ID types', () => {
    // Numeric IDs
    let result = getArrayElementIdsInComparisonOrder([{ id: 1 }, { id: 2 }], [{ id: 2 }, { id: 3 }])
    expect(result).toEqual([1, 2, 3])

    // String IDs
    result = getArrayElementIdsInComparisonOrder(
      [{ id: 'a' }, { id: 'b' }],
      [{ id: 'b' }, { id: 'c' }],
    )
    expect(result).toEqual(['a', 'b', 'c'])

    // Mixed ID types
    result = getArrayElementIdsInComparisonOrder([{ id: 1 }, { id: 'b' }], [{ id: 'b' }, { id: 2 }])
    expect(result).toEqual([1, 'b', 2])
  })

  it('handles objects with additional properties', () => {
    const newArray = [
      { id: 1, name: 'First', value: 100 },
      { id: 2, name: 'Second', active: true },
    ]
    const oldArray = [
      { id: 1, name: 'First', value: 50 },
      { id: 3, name: 'Third', status: 'pending' },
    ]

    const result = getArrayElementIdsInComparisonOrder(newArray, oldArray)

    expect(result).toEqual([1, 2, 3])
  })
})
