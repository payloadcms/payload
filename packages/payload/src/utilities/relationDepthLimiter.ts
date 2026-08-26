/**
 * Enterprise Framework - relation-depth-limiter
 */
export function isDepthExceeded(currentDepth: number, maxDepth: number = 5): boolean { return currentDepth >= maxDepth; }
