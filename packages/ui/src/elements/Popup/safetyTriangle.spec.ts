import { describe, expect, it } from 'vitest'

import type { PointerSample, Rect } from './safetyTriangle.js'

import { followTurn, getStopDelay, isApproaching } from './safetyTriangle.js'

const submenu: Rect = { bottom: 200, left: 100, right: 300, top: 100 }

const samplesAlong = ({
  from,
  intervalMs,
  step,
  steps,
}: {
  from: PointerSample
  intervalMs: number
  step: { x: number; y: number }
  steps: number
}): PointerSample[] =>
  Array.from({ length: steps + 1 }, (_, index) => ({
    time: from.time + index * intervalMs,
    x: from.x + index * step.x,
    y: from.y + index * step.y,
  }))

describe('isApproaching', () => {
  it('should arm on any progress shortly after the turn point', () => {
    const samples = samplesAlong({
      from: { time: 0, x: 50, y: 150 },
      intervalMs: 16,
      step: { x: 0.2, y: 0 },
      steps: 2,
    })

    expect(isApproaching({ samples, target: submenu })).toBe(true)
  })

  it('should disarm when the pointer travels below 30 px/s after the first third of the window', () => {
    const samples = samplesAlong({
      from: { time: 0, x: 50, y: 150 },
      intervalMs: 16,
      step: { x: 0.4, y: 0 },
      steps: 6,
    })

    expect(isApproaching({ samples, target: submenu })).toBe(false)
  })

  it('should stay armed while the pointer travels at least 30 px/s after the first third of the window', () => {
    const samples = samplesAlong({
      from: { time: 0, x: 50, y: 150 },
      intervalMs: 16,
      step: { x: 0.5, y: 0 },
      steps: 6,
    })

    expect(isApproaching({ samples, target: submenu })).toBe(true)
  })

  it('should measure speed along the path, not towards the nearest edge', () => {
    const samples = samplesAlong({
      from: { time: 0, x: 50, y: 150 },
      intervalMs: 16,
      step: { x: 0.4, y: 0.4 },
      steps: 6,
    })

    expect(isApproaching({ samples, target: submenu })).toBe(true)
  })

  it('should disarm while the pointer moves away from the target', () => {
    const samples = samplesAlong({
      from: { time: 0, x: 50, y: 150 },
      intervalMs: 16,
      step: { x: -2, y: 0 },
      steps: 5,
    })

    expect(isApproaching({ samples, target: submenu })).toBe(false)
  })

  it('should measure progress from where the pointer turned towards the target', () => {
    const away = samplesAlong({
      from: { time: 0, x: 50, y: 150 },
      intervalMs: 16,
      step: { x: -4, y: 0 },
      steps: 5,
    })
    const towards = samplesAlong({
      from: { time: 80, x: 30, y: 150 },
      intervalMs: 16,
      step: { x: 4, y: 0 },
      steps: 3,
    }).slice(1)

    expect(isApproaching({ samples: [...away, ...towards], target: submenu })).toBe(true)
  })

  it('should take the latest of equally far samples as the turn point', () => {
    const samples: PointerSample[] = [
      { time: 0, x: 50, y: 150 },
      { time: 100, x: 50, y: 140 },
      { time: 116, x: 52, y: 140 },
    ]

    expect(isApproaching({ samples, target: submenu })).toBe(true)
  })

  it('should disarm when the movement since the turn point is not aimed at the target', () => {
    const samples = samplesAlong({
      from: { time: 0, x: 50, y: 150 },
      intervalMs: 16,
      step: { x: 2, y: 6 },
      steps: 4,
    })

    expect(isApproaching({ samples, target: submenu })).toBe(false)
  })

  it('should stay armed when the movement is aimed within 4px of the target', () => {
    const samples = samplesAlong({
      from: { time: 0, x: 50, y: 150 },
      intervalMs: 16,
      step: { x: 2, y: 2.03 },
      steps: 4,
    })

    expect(isApproaching({ samples, target: submenu })).toBe(true)
  })

  it('should not judge the aim of a movement under 3px', () => {
    const samples: PointerSample[] = [
      { time: 0, x: 50, y: 150 },
      { time: 16, x: 51, y: 152 },
    ]

    expect(isApproaching({ samples, target: submenu })).toBe(true)
  })
})

describe('followTurn', () => {
  const trigger: Rect = { bottom: 124, left: 0, right: 80, top: 100 }
  const sample = ({ time = 0, x, y }: { time?: number; x: number; y: number }) => ({ time, x, y })

  it('should record no turn while the pointer approaches the current target', () => {
    expect(
      followTurn({
        currentTarget: submenu,
        otherTarget: trigger,
        pointer: sample({ x: 87, y: 131 }),
        previous: sample({ x: 85, y: 130 }),
        turn: null,
      }),
    ).toEqual({ isUndecided: false, shouldSwitchTarget: false, turn: null })
  })

  it('should stay undecided within 3px of where the pointer started moving away', () => {
    const previous = sample({ x: 90, y: 130 })

    expect(
      followTurn({
        currentTarget: submenu,
        otherTarget: trigger,
        pointer: sample({ x: 89, y: 130 }),
        previous,
        turn: null,
      }),
    ).toEqual({ isUndecided: true, shouldSwitchTarget: false, turn: previous })
  })

  it('should switch targets when the move from the turn is aimed at the other target', () => {
    const turn = sample({ x: 90, y: 130 })

    expect(
      followTurn({
        currentTarget: submenu,
        otherTarget: trigger,
        pointer: sample({ x: 86, y: 127 }),
        previous: sample({ x: 87.5, y: 128 }),
        turn,
      }),
    ).toEqual({ isUndecided: false, shouldSwitchTarget: true, turn })
  })

  it('should keep the target when the pointer turns away from both targets', () => {
    const turn = sample({ x: 90, y: 130 })

    expect(
      followTurn({
        currentTarget: submenu,
        otherTarget: trigger,
        pointer: sample({ x: 88, y: 136 }),
        previous: sample({ x: 89, y: 133 }),
        turn,
      }),
    ).toEqual({ isUndecided: false, shouldSwitchTarget: false, turn })
  })
})

describe('getStopDelay', () => {
  it('should be three times the median recent pointermove gap', () => {
    expect(getStopDelay({ gaps: [16, 17, 15, 400, 16] })).toBe(48)
  })

  it('should average the middle gaps of an even count', () => {
    expect(getStopDelay({ gaps: [10, 12, 14, 16] })).toBe(39)
  })

  it('should never be shorter than 15ms', () => {
    expect(getStopDelay({ gaps: [4, 4, 4] })).toBe(15)
  })

  it('should never be longer than 60ms', () => {
    expect(getStopDelay({ gaps: [33, 33, 33] })).toBe(60)
  })

  it('should be 60ms before any gap is known', () => {
    expect(getStopDelay({ gaps: [] })).toBe(60)
  })
})
