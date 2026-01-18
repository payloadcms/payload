import { PayloadRequest } from '@ruya.sa/payload'

import { parseCSV } from './parseCSV.js'
import { describe, it, expect, vi } from 'vitest'

describe('parseCSV', () => {
  const mockReq = {
    payload: {
      logger: {
        error: vi.fn(),
      },
    },
  } as unknown as PayloadRequest

  describe('cast function behavior', () => {
    it('should preserve comma-separated values as strings', async () => {
      const csvData = Buffer.from('numbers,ids\n"1,2,3,5,8","id1,id2,id3"')
      const result = await parseCSV({ data: csvData, req: mockReq })

      expect(result).toEqual([
        {
          numbers: '1,2,3,5,8',
          ids: 'id1,id2,id3',
        },
      ])
    })

    it('should convert single numbers to numbers', async () => {
      const csvData = Buffer.from('single,decimal\n"42","3.14"')
      const result = await parseCSV({ data: csvData, req: mockReq })

      expect(result).toEqual([
        {
          single: 42,
          decimal: 3.14,
        },
      ])
    })

    it('should handle booleans correctly', async () => {
      const csvData = Buffer.from('bool1,bool2,notBool\n"true","false","True"')
      const result = await parseCSV({ data: csvData, req: mockReq })

      expect(result).toEqual([
        {
          bool1: true,
          bool2: false,
          notBool: 'True', // Case-sensitive
        },
      ])
    })

    it('should convert empty strings to undefined', async () => {
      const csvData = Buffer.from('field1,field2\n"","value"')
      const result = await parseCSV({ data: csvData, req: mockReq })

      expect(result).toEqual([
        {
          // field1 is undefined (not present) - empty cells don't update fields
          field2: 'value',
        },
      ])
    })

    it('should handle null strings', async () => {
      const csvData = Buffer.from('field1,field2,field3\n"null","NULL","Null"')
      const result = await parseCSV({ data: csvData, req: mockReq })

      expect(result).toEqual([
        {
          field1: null,
          field2: null,
          field3: 'Null', // Case-sensitive for mixed case
        },
      ])
    })

    it('should preserve spaces in comma-separated values', async () => {
      const csvData = Buffer.from('numbers\n" 10 , 20 , 30 "')
      const result = await parseCSV({ data: csvData, req: mockReq })

      expect(result).toEqual([
        {
          numbers: ' 10 , 20 , 30 ', // CSV parser trims outer quotes but preserves the content
        },
      ])
    })

    it('should handle mixed comma-separated values with empty entries', async () => {
      const csvData = Buffer.from('mixed\n"1,,3,,5"')
      const result = await parseCSV({ data: csvData, req: mockReq })

      expect(result).toEqual([
        {
          mixed: '1,,3,,5',
        },
      ])
    })

    it('should handle MongoDB ObjectIds as strings', async () => {
      const csvData = Buffer.from('id\n"507f1f77bcf86cd799439011"')
      const result = await parseCSV({ data: csvData, req: mockReq })

      expect(result).toEqual([
        {
          id: '507f1f77bcf86cd799439011',
        },
      ])
    })

    it('should handle multiple rows with various data types', async () => {
      const csvData = Buffer.from(
        'title,count,tags,active\n' +
          '"Item 1","5","tag1,tag2,tag3","true"\n' +
          '"Item 2","","","false"\n' +
          '"Item 3","10","single",""\n',
      )
      const result = await parseCSV({ data: csvData, req: mockReq })

      expect(result).toEqual([
        {
          title: 'Item 1',
          count: 5,
          tags: 'tag1,tag2,tag3',
          active: true,
        },
        {
          title: 'Item 2',
          // count is undefined (empty cell - field not updated)
          // tags is undefined (empty cell - field not updated)
          active: false,
        },
        {
          title: 'Item 3',
          count: 10,
          tags: 'single',
          // active is undefined (empty cell - field not updated)
        },
      ])
    })

    it('should skip empty lines', async () => {
      const csvData = Buffer.from('field\n"value1"\n\n"value2"\n\n')
      const result = await parseCSV({ data: csvData, req: mockReq })

      expect(result).toEqual([{ field: 'value1' }, { field: 'value2' }])
    })
  })

  describe('error handling', () => {
    it('should handle parsing errors', async () => {
      const invalidCsv = Buffer.from('field1,field2\n"value1')

      await expect(parseCSV({ data: invalidCsv, req: mockReq })).rejects.toThrow()
      expect(mockReq.payload.logger.error).toHaveBeenCalled()
    })
  })
})
