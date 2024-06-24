// Taken from https://github.com/facebook/lexical/blob/176b8cf16ecb332ee5efe2c75219e223b7b019f2/packages/shared/src/invariant.ts

// invariant(condition, message) will refine types based on "condition", and
// if "condition" is false will throw an error. This function is special-cased
// in flow itself, so we can't name it anything else.
export function invariant(cond?: boolean, message?: string, ...args: string[]): asserts cond {
  if (cond) {
    return
  }

  throw new Error(
    'Internal Lexical error: invariant() is meant to be replaced at compile ' +
      'time. There is no runtime version. Error: ' +
      message,
  )
}
