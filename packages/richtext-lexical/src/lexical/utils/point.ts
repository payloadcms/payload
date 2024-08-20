'use client'
export class Point {
  private readonly _x: number

  private readonly _y: number

  constructor(x: number, y: number) {
    this._x = x
    this._y = y
  }

  public calcDeltaXTo({ x }: Point): number {
    return this.x - x
  }

  public calcDeltaYTo({ y }: Point): number {
    return this.y - y
  }

  public calcDistanceTo(point: Point): number {
    return Math.sqrt(Math.pow(this.calcDeltaXTo(point), 2) + Math.pow(this.calcDeltaYTo(point), 2))
  }

  public calcHorizontalDistanceTo(point: Point): number {
    return Math.abs(this.calcDeltaXTo(point))
  }

  public calcVerticalDistance(point: Point): number {
    return Math.abs(this.calcDeltaYTo(point))
  }

  public equals({ x, y }: Point): boolean {
    return this.x === x && this.y === y
  }

  get x(): number {
    return this._x
  }

  get y(): number {
    return this._y
  }
}

export function isPoint(x: unknown): x is Point {
  return x instanceof Point
}
