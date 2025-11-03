import { isTransientTransactionError } from './isTransientTransactionError.js'

describe('isTransientTransactionError', () => {
  describe('valid TransientTransactionError detection', () => {
    it('should return true for error with TransientTransactionError label', () => {
      const error = {
        errorLabels: ['TransientTransactionError'],
        message: 'Write conflict',
        code: 112,
      }

      expect(isTransientTransactionError(error)).toBe(true)
    })

    it('should return true when TransientTransactionError is among multiple labels', () => {
      const error = {
        errorLabels: ['SomeOtherLabel', 'TransientTransactionError', 'AnotherLabel'],
        message: 'Write conflict',
      }

      expect(isTransientTransactionError(error)).toBe(true)
    })

    it('should return true for MongoDB WriteConflict error', () => {
      const error = {
        ok: 0,
        errmsg: 'Write conflict during plan execution',
        code: 112,
        codeName: 'WriteConflict',
        errorLabels: ['TransientTransactionError'],
      }

      expect(isTransientTransactionError(error)).toBe(true)
    })
  })

  describe('invalid error types', () => {
    it('should return false for null', () => {
      expect(isTransientTransactionError(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isTransientTransactionError(undefined)).toBe(false)
    })

    it('should return false for string', () => {
      expect(isTransientTransactionError('error message')).toBe(false)
    })

    it('should return false for number', () => {
      expect(isTransientTransactionError(123)).toBe(false)
    })

    it('should return false for boolean', () => {
      expect(isTransientTransactionError(true)).toBe(false)
    })
  })

  describe('error objects without TransientTransactionError', () => {
    it('should return false for error without errorLabels property', () => {
      const error = {
        message: 'Some error',
        code: 123,
      }

      expect(isTransientTransactionError(error)).toBe(false)
    })

    it('should return false for error with empty errorLabels array', () => {
      const error = {
        errorLabels: [],
        message: 'Some error',
      }

      expect(isTransientTransactionError(error)).toBe(false)
    })

    it('should return false for error with different errorLabels', () => {
      const error = {
        errorLabels: ['SomeOtherError', 'AnotherError'],
        message: 'Some error',
      }

      expect(isTransientTransactionError(error)).toBe(false)
    })

    it('should return false when errorLabels is not an array', () => {
      const error = {
        errorLabels: 'TransientTransactionError',
        message: 'Some error',
      }

      expect(isTransientTransactionError(error)).toBe(false)
    })

    it('should return false when errorLabels is null', () => {
      const error = {
        errorLabels: null,
        message: 'Some error',
      }

      expect(isTransientTransactionError(error)).toBe(false)
    })

    it('should return false for standard Error instance', () => {
      const error = new Error('Standard error')
      expect(isTransientTransactionError(error)).toBe(false)
    })
  })

  describe('case sensitivity', () => {
    it('should be case sensitive (lowercase should not match)', () => {
      const error = {
        errorLabels: ['transienttransactionerror'],
        message: 'Write conflict',
      }

      expect(isTransientTransactionError(error)).toBe(false)
    })

    it('should be case sensitive (uppercase should not match)', () => {
      const error = {
        errorLabels: ['TRANSIENTTRANSACTIONERROR'],
        message: 'Write conflict',
      }

      expect(isTransientTransactionError(error)).toBe(false)
    })
  })

  describe('real MongoDB error examples', () => {
    it('should detect WriteConflict from concurrent operations', () => {
      const error = {
        ok: 0,
        errmsg:
          'Caused by :: Write conflict during plan execution and yielding is disabled. :: Please retry your operation or multi-document transaction.',
        code: 112,
        codeName: 'WriteConflict',
        errorLabels: ['TransientTransactionError'],
      }

      expect(isTransientTransactionError(error)).toBe(true)
    })

    it('should detect transaction aborted errors', () => {
      const error = {
        ok: 0,
        errmsg: 'Transaction was aborted',
        code: 251,
        codeName: 'NoSuchTransaction',
        errorLabels: ['TransientTransactionError'],
      }

      expect(isTransientTransactionError(error)).toBe(true)
    })
  })
})
