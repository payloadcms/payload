'use client'
import { isPoint, type Point } from './point.js'

interface ContainsPointReturn {
  reason: {
    isOnBottomSide: boolean
    isOnLeftSide: boolean
    isOnRightSide: boolean
    isOnTopSide: boolean
  }
  result: boolean
}

export class Rect {
  private readonly _bottom: number

  private readonly _left: number

  private readonly _right: number

  private readonly _top: number

  constructor(left: number, top: number, right: number, bottom: number) {
    const [physicTop, physicBottom] = top <= bottom ? [top, bottom] : [bottom, top]

    const [physicLeft, physicRight] = left <= right ? [left, right] : [right, left]

    this._top = physicTop
    this._right = physicRight
    this._left = physicLeft
    this._bottom = physicBottom
  }

  static fromDOM(dom: HTMLElement): Rect {
    const { height, left, top, width } = dom.getBoundingClientRect()
    return Rect.fromLWTH(left, width, top, height)
  }

  static fromDOMRect(domRect: DOMRect): Rect {
    const { height, left, top, width } = domRect
    return Rect.fromLWTH(left, width, top, height)
  }

  static fromLTRB(left: number, top: number, right: number, bottom: number): Rect {
    return new Rect(left, top, right, bottom)
  }

  static fromLWTH(left: number, width: number, top: number, height: number): Rect {
    return new Rect(left, top, left + width, top + height)
  }

  static fromPoints(startPoint: Point, endPoint: Point): Rect {
    const { x: left, y: top } = startPoint
    const { x: right, y: bottom } = endPoint
    return Rect.fromLTRB(left, top, right, bottom)
  }

  public contains({ x, y }: Point): ContainsPointReturn

  public contains({ bottom, left, right, top }: Rect): boolean

  public contains(target: Point | Rect): boolean | ContainsPointReturn {
    if (isPoint(target)) {
      const { x, y } = target

      const isOnTopSide = y < this._top
      const isOnBottomSide = y > this._bottom
      const isOnLeftSide = x < this._left
      const isOnRightSide = x > this._right

      const result = !isOnTopSide && !isOnBottomSide && !isOnLeftSide && !isOnRightSide

      return {
        reason: {
          isOnBottomSide,
          isOnLeftSide,
          isOnRightSide,
          isOnTopSide,
        },
        result,
      }
    }
    const { bottom, left, right, top } = target

    return (
      top >= this._top &&
      top <= this._bottom &&
      bottom >= this._top &&
      bottom <= this._bottom &&
      left >= this._left &&
      left <= this._right &&
      right >= this._left &&
      right <= this._right
    )
  }

  public distanceFromPoint(point: Point): {
    distance: number
    isOnBottomSide: boolean
    isOnLeftSide: boolean
    isOnRightSide: boolean
    isOnTopSide: boolean
  } {
    const containsResult = this.contains(point)
    if (containsResult.result) {
      return {
        distance: 0,
        isOnBottomSide: containsResult.reason.isOnBottomSide,
        isOnLeftSide: containsResult.reason.isOnLeftSide,
        isOnRightSide: containsResult.reason.isOnRightSide,
        isOnTopSide: containsResult.reason.isOnTopSide,
      }
    }

    let dx = 0 // Horizontal distance to the closest edge
    let dy = 0 // Vertical distance to the closest edge

    // If the point is to the left of the rectangle
    if (point.x < this._left) {
      dx = this._left - point.x
    }
    // If the point is to the right of the rectangle
    else if (point.x > this._right) {
      dx = point.x - this._right
    }

    // If the point is above the rectangle
    if (point.y < this._top) {
      dy = this._top - point.y
    }
    // If the point is below the rectangle
    else if (point.y > this._bottom) {
      dy = point.y - this._bottom
    }

    // Use the Pythagorean theorem to calculate the distance
    return {
      distance: Math.sqrt(dx * dx + dy * dy),
      isOnBottomSide: point.y > this._bottom,
      isOnLeftSide: point.x < this._left,
      isOnRightSide: point.x > this._right,
      isOnTopSide: point.y < this._top,
    }
  }

  public equals({ bottom, left, right, top }: Rect): boolean {
    return (
      top === this._top && bottom === this._bottom && left === this._left && right === this._right
    )
  }

  public generateNewRect({
    bottom = this.bottom,
    left = this.left,
    right = this.right,
    top = this.top,
  }): Rect {
    return new Rect(left, top, right, bottom)
  }

  public intersectsWith(rect: Rect): boolean {
    const { height: h1, left: x1, top: y1, width: w1 } = rect
    const { height: h2, left: x2, top: y2, width: w2 } = this
    const maxX = x1 + w1 >= x2 + w2 ? x1 + w1 : x2 + w2
    const maxY = y1 + h1 >= y2 + h2 ? y1 + h1 : y2 + h2
    const minX = x1 <= x2 ? x1 : x2
    const minY = y1 <= y2 ? y1 : y2
    return maxX - minX <= w1 + w2 && maxY - minY <= h1 + h2
  }

  get bottom(): number {
    return this._bottom
  }

  get height(): number {
    return Math.abs(this._bottom - this._top)
  }

  get left(): number {
    return this._left
  }

  get right(): number {
    return this._right
  }

  get top(): number {
    return this._top
  }

  get width(): number {
    return Math.abs(this._left - this._right)
  }
}
