import { loadSkillContext } from '../skillContent.js'

const SKILL_CONTEXT = loadSkillContext()

const CODEGEN_RULES = `Rules:
- Output ONLY the full TypeScript file content — no prose, no markdown code fences, no explanation
- Preserve all existing imports, collections, fields, and settings unless the task requires changing them
- This is Payload CMS v3. Always import types from "payload" — never from "payload/types" (that is the old v2 path)
- Use correct Payload types: CollectionConfig, Plugin, Config from "payload"
- Field types: text, textarea, number, checkbox, select, relationship, richText, array, group, blocks, date, email, upload
- Access control functions receive ({ req }) and return boolean or Promise<boolean>
- Hooks live in a hooks object with arrays: beforeChange, afterRead, beforeDelete, etc.
- Plugins are functions that receive a Config and must return a Config — always cast the return value: \`return { ...incomingConfig, ... } as Config\`
- Localization uses a localization key with locales, defaultLocale, and fallback`

function buildCodegenPrompt(withSkill: boolean): string {
  const preamble = `You are an expert Payload CMS developer.
You will be given a task and a starter payload.config.ts file.
Apply the requested change to the config and output the complete modified TypeScript file.`

  return withSkill
    ? `${preamble}\n\n${SKILL_CONTEXT}\n\n${CODEGEN_RULES}`
    : `${preamble}\n\n${CODEGEN_RULES}`
}

export const SYSTEM_PROMPTS = {
  /**
   * For config-modification evals — with SKILL.md injected as passive context.
   * Pair with codegenNoSkill to measure how much SKILL.md improves code generation.
   */
  codegenWithSkill: buildCodegenPrompt(true),

  /** Baseline codegen: no skill document injected. */
  codegenNoSkill: buildCodegenPrompt(false),
}
