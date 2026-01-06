import { describe, expect, it } from 'vitest'

import { InvalidConfiguration } from '../errors/index.js'
import { validateTimezones } from './validateTimezones.js'

describe('validateTimezones', () => {
  describe('valid timezones', () => {
    it('should accept UTC timezone', () => {
      expect(() =>
        validateTimezones({
          timezones: [{ label: 'UTC', value: 'UTC' }],
        }),
      ).not.toThrow()
    })

    it.each([
      'America/New_York',
      'America/Los_Angeles',
      'America/Chicago',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Singapore',
      'Australia/Sydney',
      'Pacific/Auckland',
    ])('should accept valid IANA timezone: %s', (timezone) => {
      expect(() =>
        validateTimezones({
          timezones: [{ label: timezone, value: timezone }],
        }),
      ).not.toThrow()
    })

    it('should accept multiple valid timezones', () => {
      expect(() =>
        validateTimezones({
          timezones: [
            { label: 'New York', value: 'America/New_York' },
            { label: 'London', value: 'Europe/London' },
            { label: 'Tokyo', value: 'Asia/Tokyo' },
          ],
        }),
      ).not.toThrow()
    })

    it('should accept empty array', () => {
      expect(() =>
        validateTimezones({
          timezones: [],
        }),
      ).not.toThrow()
    })

    it('should accept undefined timezones', () => {
      expect(() =>
        validateTimezones({
          timezones: undefined,
        }),
      ).not.toThrow()
    })
  })

  describe('invalid timezones', () => {
    it('should throw for completely invalid timezone', () => {
      expect(() =>
        validateTimezones({
          timezones: [{ label: 'Invalid', value: 'Invalid/Timezone' }],
        }),
      ).toThrow(InvalidConfiguration)
    })

    it('should throw for made up timezone', () => {
      expect(() =>
        validateTimezones({
          timezones: [{ label: 'Fake', value: 'Fake/Place' }],
        }),
      ).toThrow(InvalidConfiguration)
    })

    it('should throw for empty string timezone value', () => {
      expect(() =>
        validateTimezones({
          timezones: [{ label: 'Empty', value: '' }],
        }),
      ).toThrow(InvalidConfiguration)
    })

    it('should throw for random string timezone', () => {
      expect(() =>
        validateTimezones({
          timezones: [{ label: 'Random', value: 'not-a-timezone' }],
        }),
      ).toThrow(InvalidConfiguration)
    })
  })

  describe('misspelled timezones', () => {
    it.each([
      ['Asian/Tokyo', 'Asia/Tokyo'],
      ['Asian/Shanghai', 'Asia/Shanghai'],
      ['Asian/Singapore', 'Asia/Singapore'],
      ['Asian/Seoul', 'Asia/Seoul'],
      ['Asian/Bangkok', 'Asia/Bangkok'],
    ])('should throw for misspelled "Asian/" instead of "Asia/": %s', (misspelled) => {
      expect(() =>
        validateTimezones({
          timezones: [{ label: misspelled, value: misspelled }],
        }),
      ).toThrow(InvalidConfiguration)
    })

    it.each([
      ['Americas/New_York', 'America/New_York'],
      ['Americas/Los_Angeles', 'America/Los_Angeles'],
      ['Americas/Chicago', 'America/Chicago'],
    ])('should throw for misspelled "Americas/" instead of "America/": %s', (misspelled) => {
      expect(() =>
        validateTimezones({
          timezones: [{ label: misspelled, value: misspelled }],
        }),
      ).toThrow(InvalidConfiguration)
    })

    it.each([
      ['Europ/London', 'Europe/London'],
      ['Euorpe/Paris', 'Europe/Paris'],
      ['Europa/Berlin', 'Europe/Berlin'],
    ])('should throw for misspelled Europe region: %s', (misspelled) => {
      expect(() =>
        validateTimezones({
          timezones: [{ label: misspelled, value: misspelled }],
        }),
      ).toThrow(InvalidConfiguration)
    })

    it.each([
      ['Australa/Sydney', 'Australia/Sydney'],
      ['Austrlia/Melbourne', 'Australia/Melbourne'],
    ])('should throw for misspelled Australia region: %s', (misspelled) => {
      expect(() =>
        validateTimezones({
          timezones: [{ label: misspelled, value: misspelled }],
        }),
      ).toThrow(InvalidConfiguration)
    })

    it.each([
      ['Pacific/Aukland', 'Pacific/Auckland'],
      ['Pacfic/Auckland', 'Pacific/Auckland'],
    ])('should throw for misspelled Pacific region or city: %s', (misspelled) => {
      expect(() =>
        validateTimezones({
          timezones: [{ label: misspelled, value: misspelled }],
        }),
      ).toThrow(InvalidConfiguration)
    })

    it.each([
      'America/NewYork', // missing underscore
      'America/New-York', // hyphen instead of underscore
      'America/newyork', // missing underscore and wrong case for city
    ])('should throw for incorrectly formatted city name: %s', (misspelled) => {
      expect(() =>
        validateTimezones({
          timezones: [{ label: misspelled, value: misspelled }],
        }),
      ).toThrow(InvalidConfiguration)
    })

    // Note: Intl API is case-insensitive, so lowercase versions like 'america/new_york' are valid
    it('should accept lowercase timezone (Intl API is case-insensitive)', () => {
      expect(() =>
        validateTimezones({
          timezones: [{ label: 'lowercase', value: 'america/new_york' }],
        }),
      ).not.toThrow()
    })
  })

  describe('error messages', () => {
    it('should include timezone value in error message', () => {
      expect(() =>
        validateTimezones({
          timezones: [{ label: 'Bad', value: 'Invalid/Zone' }],
        }),
      ).toThrow(/Invalid\/Zone/)
    })

    it('should include source in error message when provided', () => {
      expect(() =>
        validateTimezones({
          source: 'admin.timezones.supportedTimezones',
          timezones: [{ label: 'Bad', value: 'Invalid/Zone' }],
        }),
      ).toThrow(/admin\.timezones\.supportedTimezones/)
    })

    it('should include field name in source for field-level errors', () => {
      expect(() =>
        validateTimezones({
          source: 'field "publishedAt" timezone.supportedTimezones',
          timezones: [{ label: 'Bad', value: 'Asian/Tokyo' }],
        }),
      ).toThrow(/field "publishedAt"/)
    })
  })

  describe('mixed valid and invalid timezones', () => {
    it('should throw when array contains at least one invalid timezone', () => {
      expect(() =>
        validateTimezones({
          timezones: [
            { label: 'New York', value: 'America/New_York' },
            { label: 'Invalid', value: 'Asian/Tokyo' }, // misspelled
            { label: 'London', value: 'Europe/London' },
          ],
        }),
      ).toThrow(InvalidConfiguration)
    })

    it('should throw on first invalid timezone encountered', () => {
      expect(() =>
        validateTimezones({
          timezones: [
            { label: 'First Invalid', value: 'Fake/First' },
            { label: 'Second Invalid', value: 'Fake/Second' },
          ],
        }),
      ).toThrow(/Fake\/First/)
    })
  })
})
