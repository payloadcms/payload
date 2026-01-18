'use client';

import { isPoint } from './point.js';
export class Rect {
  _bottom;
  _left;
  _right;
  _top;
  constructor(left, top, right, bottom) {
    const [physicTop, physicBottom] = top <= bottom ? [top, bottom] : [bottom, top];
    const [physicLeft, physicRight] = left <= right ? [left, right] : [right, left];
    this._top = physicTop;
    this._right = physicRight;
    this._left = physicLeft;
    this._bottom = physicBottom;
  }
  static fromDOM(dom) {
    const {
      height,
      left,
      top,
      width
    } = dom.getBoundingClientRect();
    return Rect.fromLWTH(left, width, top, height);
  }
  static fromDOMRect(domRect) {
    const {
      height,
      left,
      top,
      width
    } = domRect;
    return Rect.fromLWTH(left, width, top, height);
  }
  static fromLTRB(left, top, right, bottom) {
    return new Rect(left, top, right, bottom);
  }
  static fromLWTH(left, width, top, height) {
    return new Rect(left, top, left + width, top + height);
  }
  static fromPoints(startPoint, endPoint) {
    const {
      x: left,
      y: top
    } = startPoint;
    const {
      x: right,
      y: bottom
    } = endPoint;
    return Rect.fromLTRB(left, top, right, bottom);
  }
  contains(target) {
    if (isPoint(target)) {
      const {
        x,
        y
      } = target;
      const isOnTopSide = y < this._top;
      const isOnBottomSide = y > this._bottom;
      const isOnLeftSide = x < this._left;
      const isOnRightSide = x > this._right;
      const result = !isOnTopSide && !isOnBottomSide && !isOnLeftSide && !isOnRightSide;
      return {
        reason: {
          isOnBottomSide,
          isOnLeftSide,
          isOnRightSide,
          isOnTopSide
        },
        result
      };
    }
    const {
      bottom,
      left,
      right,
      top
    } = target;
    return top >= this._top && top <= this._bottom && bottom >= this._top && bottom <= this._bottom && left >= this._left && left <= this._right && right >= this._left && right <= this._right;
  }
  distanceFromPoint(point) {
    const containsResult = this.contains(point);
    if (containsResult.result) {
      return {
        distance: 0,
        isOnBottomSide: containsResult.reason.isOnBottomSide,
        isOnLeftSide: containsResult.reason.isOnLeftSide,
        isOnRightSide: containsResult.reason.isOnRightSide,
        isOnTopSide: containsResult.reason.isOnTopSide
      };
    }
    let dx = 0 // Horizontal distance to the closest edge
    ;
    let dy = 0 // Vertical distance to the closest edge
    ;
    // If the point is to the left of the rectangle
    if (point.x < this._left) {
      dx = this._left - point.x;
    } else if (point.x > this._right) {
      dx = point.x - this._right;
    }
    // If the point is above the rectangle
    if (point.y < this._top) {
      dy = this._top - point.y;
    } else if (point.y > this._bottom) {
      dy = point.y - this._bottom;
    }
    // Use the Pythagorean theorem to calculate the distance
    return {
      distance: Math.sqrt(dx * dx + dy * dy),
      isOnBottomSide: point.y > this._bottom,
      isOnLeftSide: point.x < this._left,
      isOnRightSide: point.x > this._right,
      isOnTopSide: point.y < this._top
    };
  }
  equals({
    bottom,
    left,
    right,
    top
  }) {
    return top === this._top && bottom === this._bottom && left === this._left && right === this._right;
  }
  generateNewRect({
    bottom = this.bottom,
    left = this.left,
    right = this.right,
    top = this.top
  }) {
    return new Rect(left, top, right, bottom);
  }
  intersectsWith(rect) {
    const {
      height: h1,
      left: x1,
      top: y1,
      width: w1
    } = rect;
    const {
      height: h2,
      left: x2,
      top: y2,
      width: w2
    } = this;
    const maxX = x1 + w1 >= x2 + w2 ? x1 + w1 : x2 + w2;
    const maxY = y1 + h1 >= y2 + h2 ? y1 + h1 : y2 + h2;
    const minX = x1 <= x2 ? x1 : x2;
    const minY = y1 <= y2 ? y1 : y2;
    return maxX - minX <= w1 + w2 && maxY - minY <= h1 + h2;
  }
  get bottom() {
    return this._bottom;
  }
  get height() {
    return Math.abs(this._bottom - this._top);
  }
  get left() {
    return this._left;
  }
  get right() {
    return this._right;
  }
  get top() {
    return this._top;
  }
  get width() {
    return Math.abs(this._left - this._right);
  }
}
//# sourceMappingURL=rect.js.map