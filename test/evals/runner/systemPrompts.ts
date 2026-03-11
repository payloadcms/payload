import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const skillPath = path.resolve(process.cwd(), 'tools/claude-plugin/skills/payload/SKILL.md')
const SKILL_CONTEXT = fs.readFileSync(skillPath, 'utf-8')

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

function buildQAPrompt(withSkill: boolean): string {
  return withSkill
    ? `You are an expert Payload CMS developer.\nAnswer questions accurately and concisely based on the following skill document:\n\n${SKILL_CONTEXT}`
    : `You are an expert Payload CMS developer.\nAnswer questions accurately and concisely.`
}

export const SYSTEM_PROMPTS = {
  /**
   * For Q&A evals — with SKILL.md injected as passive context.
   * Pair with qaNoSkill to measure how much SKILL.md improves answers.
   */
  qaWithSkill: buildQAPrompt(true),

  /** Baseline Q&A: no skill document injected. */
  qaNoSkill: buildQAPrompt(false),

  /**
   * For config-review evals: given a broken payload.config.ts, identify and explain the errors.
   */
  configReview: `You are an expert Payload CMS developer reviewing configs for correctness.
You will be given a payload.config.ts file and a question about it.
Identify any errors, misuse of the API, or incorrect patterns.
Be specific: name the exact property or function, explain what is wrong, and state what the correct value or pattern should be.
Valid Payload field types: text, textarea, number, checkbox, select, relationship, richText, array, group, blocks, date, email, upload.
Access control functions must return a boolean or a Payload where-constraint object — never a string or other value.
Hook functions in beforeChange must explicitly return the data object, otherwise changes are silently discarded.`,

  /**
   * For config-modification evals — with SKILL.md injected as passive context.
   * Pair with codegenNoSkill to measure how much SKILL.md improves code generation.
   */
  codegenWithSkill: buildCodegenPrompt(true),

  /** Baseline codegen: no skill document injected. */
  codegenNoSkill: buildCodegenPrompt(false),
}
