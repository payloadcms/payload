import { withTransactionRetry } from './withTransactionRetry.js'

describe('withTransactionRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isTransientTransactionError detection', () => {
    it('should not retry on non-transient errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Regular error'))

      await expect(withTransactionRetry(operation)).rejects.toThrow('Regular error')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on TransientTransactionError', async () => {
      const transientError = {
        errorLabels: ['TransientTransactionError'],
        message: 'Write conflict',
        code: 112,
      }

      const operation = jest
        .fn()
        .mockRejectedValueOnce(transientError)
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce('success')

      const result = await withTransactionRetry(operation)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should throw after max retries exceeded', async () => {
      const transientError = {
        errorLabels: ['TransientTransactionError'],
        message: 'Write conflict',
        code: 112,
      }

      const operation = jest.fn().mockRejectedValue(transientError)

      await expect(
        withTransactionRetry(operation, { maxRetries: 2, initialBackoffMs: 1 }),
      ).rejects.toEqual(transientError)

      // 1 initial attempt + 2 retries = 3 total calls
      expect(operation).toHaveBeenCalledTimes(3)
    })
  })

  describe('exponential backoff', () => {
    it('should use exponential backoff between retries', async () => {
      const transientError = {
        errorLabels: ['TransientTransactionError'],
        message: 'Write conflict',
      }

      const operation = jest
        .fn()
        .mockRejectedValueOnce(transientError)
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce('success')

      const delaysRequested: number[] = []

      await withTransactionRetry(operation, {
        initialBackoffMs: 10,
        backoffMultiplier: 2,
        onRetry: (_attempt, _error, delayMs) => {
          delaysRequested.push(delayMs)
        },
      })

      // First retry should request 10ms delay, second 20ms
      expect(delaysRequested).toEqual([10, 20])
    })
  })

  describe('onRetry callback', () => {
    it('should call onRetry callback with correct parameters', async () => {
      const transientError = {
        errorLabels: ['TransientTransactionError'],
        message: 'Write conflict',
      }

      const operation = jest
        .fn()
        .mockRejectedValueOnce(transientError)
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce('success')

      const onRetry = jest.fn()

      await withTransactionRetry(operation, {
        initialBackoffMs: 10,
        backoffMultiplier: 2,
        onRetry,
      })

      expect(onRetry).toHaveBeenCalledTimes(2)
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, transientError, 10)
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, transientError, 20)
    })

    it('should not call onRetry on success', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      const onRetry = jest.fn()

      await withTransactionRetry(operation, { onRetry })

      expect(operation).toHaveBeenCalledTimes(1)
      expect(onRetry).not.toHaveBeenCalled()
    })
  })

  describe('success scenarios', () => {
    it('should return result on first attempt if successful', async () => {
      const operation = jest.fn().mockResolvedValue('success')

      const result = await withTransactionRetry(operation)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should return result after retries if eventually successful', async () => {
      const transientError = {
        errorLabels: ['TransientTransactionError'],
        message: 'Write conflict',
      }

      const operation = jest
        .fn()
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce('success')

      const result = await withTransactionRetry(operation, { initialBackoffMs: 1 })

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('error types', () => {
    it('should not retry on null error', async () => {
      const operation = jest.fn().mockRejectedValue(null)

      await expect(withTransactionRetry(operation)).rejects.toBeNull()
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should not retry on string error', async () => {
      const operation = jest.fn().mockRejectedValue('error string')

      await expect(withTransactionRetry(operation)).rejects.toBe('error string')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should not retry on error with non-array errorLabels', async () => {
      const error = {
        errorLabels: 'TransientTransactionError', // Wrong type
        message: 'error',
      }

      const operation = jest.fn().mockRejectedValue(error)

      await expect(withTransactionRetry(operation)).rejects.toEqual(error)
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should not retry on error with empty errorLabels', async () => {
      const error = {
        errorLabels: [],
        message: 'error',
      }

      const operation = jest.fn().mockRejectedValue(error)

      await expect(withTransactionRetry(operation)).rejects.toEqual(error)
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should not retry on error with different errorLabel', async () => {
      const error = {
        errorLabels: ['SomeOtherError'],
        message: 'error',
      }

      const operation = jest.fn().mockRejectedValue(error)

      await expect(withTransactionRetry(operation)).rejects.toEqual(error)
      expect(operation).toHaveBeenCalledTimes(1)
    })
  })

  describe('configuration options', () => {
    it('should respect custom maxRetries', async () => {
      const transientError = {
        errorLabels: ['TransientTransactionError'],
        message: 'Write conflict',
      }

      const operation = jest.fn().mockRejectedValue(transientError)

      await expect(
        withTransactionRetry(operation, { maxRetries: 5, initialBackoffMs: 1 }),
      ).rejects.toEqual(transientError)

      // 1 initial attempt + 5 retries = 6 total calls
      expect(operation).toHaveBeenCalledTimes(6)
    })

    it('should use default options when not provided', async () => {
      const transientError = {
        errorLabels: ['TransientTransactionError'],
        message: 'Write conflict',
      }

      const operation = jest.fn().mockRejectedValue(transientError)

      await expect(withTransactionRetry(operation, { initialBackoffMs: 1 })).rejects.toEqual(
        transientError,
      )

      // Default maxRetries is 3, so 1 initial + 3 retries = 4 total calls
      expect(operation).toHaveBeenCalledTimes(4)
    })
  })
})
