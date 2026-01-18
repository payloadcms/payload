'use client';

export class Point {
  _x;
  _y;
  constructor(x, y) {
    this._x = x;
    this._y = y;
  }
  calcDeltaXTo({
    x
  }) {
    return this.x - x;
  }
  calcDeltaYTo({
    y
  }) {
    return this.y - y;
  }
  calcDistanceTo(point) {
    return Math.sqrt(Math.pow(this.calcDeltaXTo(point), 2) + Math.pow(this.calcDeltaYTo(point), 2));
  }
  calcHorizontalDistanceTo(point) {
    return Math.abs(this.calcDeltaXTo(point));
  }
  calcVerticalDistance(point) {
    return Math.abs(this.calcDeltaYTo(point));
  }
  equals({
    x,
    y
  }) {
    return this.x === x && this.y === y;
  }
  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }
}
export function isPoint(x) {
  return x instanceof Point;
}
//# sourceMappingURL=point.js.map