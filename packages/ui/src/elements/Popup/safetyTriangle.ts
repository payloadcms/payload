export type Point = { x: number; y: number }

export type PointerSample = { time: number } & Point

export type Rect = Pick<DOMRectReadOnly, 'bottom' | 'left' | 'right' | 'top'>

export const SAMPLE_WINDOW_MS = 150

export const STOP_DELAY_GAP_COUNT = 8

const AIM_SLACK = 4
const MIN_AIM_DISTANCE = 3
const MIN_APPROACH_SPEED = 30
const STOP_DELAY_GAP_MULTIPLIER = 3
const MIN_STOP_DELAY_MS = 15
const MAX_STOP_DELAY_MS = 60

export const isApproaching = ({
  samples,
  target,
}: {
  samples: PointerSample[]
  target: Rect
}): boolean => {
  const current = samples[samples.length - 1]
  let turnPoint = samples[0]
  let turnDistance = getDistanceToRect({ point: turnPoint, rect: target })

  for (const sample of samples) {
    const distance = getDistanceToRect({ point: sample, rect: target })

    if (distance >= turnDistance) {
      turnPoint = sample
      turnDistance = distance
    }
  }

  const elapsed = current.time - turnPoint.time

  if (elapsed <= 0 || !isAimedAt({ from: turnPoint, target, to: current })) {
    return false
  }

  const progress = turnDistance - getDistanceToRect({ point: current, rect: target })
  const speed = (getDistance({ from: turnPoint, to: current }) / elapsed) * 1000

  return progress > 0 && (elapsed < SAMPLE_WINDOW_MS / 3 || speed >= MIN_APPROACH_SPEED)
}

export const followTurn = ({
  currentTarget,
  otherTarget,
  pointer,
  previous,
  turn,
}: {
  currentTarget: Rect
  otherTarget: Rect
  pointer: PointerSample
  previous?: PointerSample
  turn: null | PointerSample
}): { isUndecided: boolean; shouldSwitchTarget: boolean; turn: null | PointerSample } => {
  const isMovingAway =
    previous !== undefined &&
    getDistanceToRect({ point: pointer, rect: currentTarget }) >
      getDistanceToRect({ point: previous, rect: currentTarget })
  const nextTurn = isMovingAway ? (turn ?? previous) : null

  if (!nextTurn) {
    return { isUndecided: false, shouldSwitchTarget: false, turn: null }
  }

  if (getDistance({ from: nextTurn, to: pointer }) < MIN_AIM_DISTANCE) {
    return { isUndecided: true, shouldSwitchTarget: false, turn: nextTurn }
  }

  const shouldSwitchTarget =
    isAimedAt({ from: nextTurn, target: otherTarget, to: pointer }) &&
    getDistanceToRect({ point: pointer, rect: otherTarget }) <
      getDistanceToRect({ point: nextTurn, rect: otherTarget }) &&
    getDistanceToRect({ point: pointer, rect: currentTarget }) >=
      getDistanceToRect({ point: nextTurn, rect: currentTarget })

  return { isUndecided: false, shouldSwitchTarget, turn: nextTurn }
}

export const getStopDelay = ({ gaps }: { gaps: number[] }): number => {
  if (gaps.length === 0) {
    return MAX_STOP_DELAY_MS
  }

  const sorted = [...gaps].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2

  return Math.min(
    MAX_STOP_DELAY_MS,
    Math.max(MIN_STOP_DELAY_MS, median * STOP_DELAY_GAP_MULTIPLIER),
  )
}

const getDistance = ({ from, to }: { from: Point; to: Point }) =>
  Math.hypot(to.x - from.x, to.y - from.y)

const getDistanceToRect = ({ point, rect }: { point: Point; rect: Rect }) =>
  Math.hypot(
    Math.max(rect.left - point.x, 0, point.x - rect.right),
    Math.max(rect.top - point.y, 0, point.y - rect.bottom),
  )

const isAimedAt = ({ from, target, to }: { from: Point; target: Rect; to: Point }) => {
  const delta = { x: to.x - from.x, y: to.y - from.y }

  if (Math.hypot(delta.x, delta.y) < MIN_AIM_DISTANCE) {
    return true
  }

  let enter = 0
  let exit = Infinity

  for (const [origin, step, min, max] of [
    [from.x, delta.x, target.left - AIM_SLACK, target.right + AIM_SLACK],
    [from.y, delta.y, target.top - AIM_SLACK, target.bottom + AIM_SLACK],
  ]) {
    if (step === 0) {
      if (origin < min || origin > max) {
        return false
      }
      continue
    }

    const near = (min - origin) / step
    const far = (max - origin) / step

    enter = Math.max(enter, Math.min(near, far))
    exit = Math.min(exit, Math.max(near, far))
  }

  return enter <= exit
}
