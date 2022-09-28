import {
  NodePath,
  PluginObj,
  types as BabelTypes
} from  '@babel/core'

type PluginState = {
  refs: Set<NodePath<BabelTypes.Identifier>>
  isPrerender: boolean
  isServerProps: boolean
  done: boolean
}

export default function nextTransformSsg({
  types: t,
}: {
  types: typeof BabelTypes
}): PluginObj<PluginState> {
  return null;
}