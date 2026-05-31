'use client'

import type { JSONFieldClientProps } from 'payload'

import { CheckboxInput, Collapsible, useField } from '@payloadcms/ui'
import React from 'react'

import type { ClientMCPPluginConfig, MCPAPIKeysDocAccessTree } from '../../types.js'

import './index.css'

const baseClass = 'mcp-access-field'

type ClientItem = ClientMCPPluginConfig['items'][number]
type ScopeKey = 'collections' | 'globals'
type FlatKey = 'prompts' | 'resources' | 'tools'

type Props = JSONFieldClientProps & {
  pluginConfig: ClientMCPPluginConfig
}

/** Drop a key from an object and return a new object — or `undefined` if it'd be empty. */
const without = <T extends Record<string, unknown>>(
  obj: T | undefined,
  key: string,
): T | undefined => {
  if (!obj || !(key in obj)) {
    return obj
  }
  const { [key]: _omitted, ...rest } = obj
  return Object.keys(rest).length === 0 ? undefined : (rest as T)
}

const setKey = <T extends Record<string, unknown>>(
  obj: T | undefined,
  key: string,
  value: unknown,
): T => ({ ...(obj ?? {}), [key]: value }) as T

export const AccessField: React.FC<Props> = ({ path, pluginConfig }) => {
  const { setValue, value } = useField<MCPAPIKeysDocAccessTree>({ path })
  const access = value ?? {}

  // Bucket items for rendering. (Bucketing is cheap and runs once per render;
  // memoizing would mean managing inputs/refs for marginal benefit.)
  const collectionsBySlug: Record<string, ClientItem[]> = {}
  const globalsBySlug: Record<string, ClientItem[]> = {}
  const tools: ClientItem[] = []
  const prompts: ClientItem[] = []
  const resources: ClientItem[] = []
  for (const item of pluginConfig.items) {
    switch (item.type) {
      case 'collectionTool':
        ;(collectionsBySlug[item.collectionSlug!] ??= []).push(item)
        break
      case 'globalTool':
        ;(globalsBySlug[item.globalSlug!] ??= []).push(item)
        break
      case 'prompt':
        prompts.push(item)
        break
      case 'resource':
        resources.push(item)
        break
      case 'tool':
        tools.push(item)
        break
    }
  }

  const isScopedAllowed = (scope: ScopeKey, slug: string, key: string): boolean =>
    access[scope]?.[slug]?.[key] !== false

  const isFlatAllowed = (scope: FlatKey, key: string): boolean => access[scope]?.[key] !== false

  const toggleScoped = (scope: ScopeKey, slug: string, key: string, allow: boolean) => {
    if (allow) {
      const slugBucket = without(access[scope]?.[slug], key)
      const scopeBucket = slugBucket
        ? setKey(access[scope], slug, slugBucket)
        : without(access[scope], slug)
      setValue(scopeBucket ? setKey(access, scope, scopeBucket) : (without(access, scope) ?? {}))
    } else {
      setValue(
        setKey(
          access,
          scope,
          setKey(access[scope], slug, setKey(access[scope]?.[slug], key, false)),
        ),
      )
    }
  }

  const toggleFlat = (scope: FlatKey, key: string, allow: boolean) => {
    if (allow) {
      const bucket = without(access[scope], key)
      setValue(bucket ? setKey(access, scope, bucket) : (without(access, scope) ?? {}))
    } else {
      setValue(setKey(access, scope, setKey(access[scope], key, false)))
    }
  }

  const setAllScoped = (scope: ScopeKey, slug: string, leaves: ClientItem[], allow: boolean) => {
    if (allow) {
      const scopeBucket = without(access[scope], slug)
      setValue(scopeBucket ? setKey(access, scope, scopeBucket) : (without(access, scope) ?? {}))
    } else {
      const slugBucket = leaves.reduce<Record<string, boolean>>(
        (acc, leaf) => ({ ...acc, [leaf.key]: false }),
        {},
      )
      setValue(setKey(access, scope, setKey(access[scope], slug, slugBucket)))
    }
  }

  const setAllFlat = (scope: FlatKey, leaves: ClientItem[], allow: boolean) => {
    if (allow) {
      setValue(without(access, scope) ?? {})
    } else {
      const bucket = leaves.reduce<Record<string, boolean>>(
        (acc, leaf) => ({ ...acc, [leaf.key]: false }),
        {},
      )
      setValue(setKey(access, scope, bucket))
    }
  }

  const collectionSlugs = Object.keys(collectionsBySlug)
  const globalSlugs = Object.keys(globalsBySlug)

  return (
    <div className={baseClass}>
      {collectionSlugs.length > 0 && (
        <section className={`${baseClass}__section`}>
          <header className={`${baseClass}__section-header`}>
            {/* TODO: needs i18n once design is finalized */}
            <h4>Collection-level permissions</h4>
            {/* TODO: needs i18n once design is finalized */}
            <p>Allow MCP clients to perform the following actions within these collections:</p>
          </header>
          {collectionSlugs.map((slug) => {
            const leaves = collectionsBySlug[slug]!
            return (
              <Collapsible
                actions={
                  <GroupActions
                    onSetAll={(allow) => setAllScoped('collections', slug, leaves, allow)}
                  />
                }
                className={`${baseClass}__group`}
                header={<span className={`${baseClass}__group-label`}>{titleCase(slug)}</span>}
                initCollapsed
                key={`collection-${slug}`}
              >
                <ul className={`${baseClass}__list`}>
                  {leaves.map((leaf) => (
                    <li key={leaf.key}>
                      <CheckboxInput
                        checked={isScopedAllowed('collections', slug, leaf.key)}
                        id={`${path}.collections.${slug}.${leaf.key}`}
                        label={leaf.label}
                        onToggle={(e) =>
                          toggleScoped('collections', slug, leaf.key, e.target.checked)
                        }
                        tooltip={leaf.description}
                      />
                    </li>
                  ))}
                </ul>
              </Collapsible>
            )
          })}
        </section>
      )}

      {globalSlugs.length > 0 && (
        <section className={`${baseClass}__section`}>
          <header className={`${baseClass}__section-header`}>
            {/* TODO: needs i18n once design is finalized */}
            <h4>Global-level permissions</h4>
            {/* TODO: needs i18n once design is finalized */}
            <p>Allow MCP clients to perform the following actions on these globals:</p>
          </header>
          {globalSlugs.map((slug) => {
            const leaves = globalsBySlug[slug]!
            return (
              <Collapsible
                actions={
                  <GroupActions
                    onSetAll={(allow) => setAllScoped('globals', slug, leaves, allow)}
                  />
                }
                className={`${baseClass}__group`}
                header={<span className={`${baseClass}__group-label`}>{titleCase(slug)}</span>}
                initCollapsed
                key={`global-${slug}`}
              >
                <ul className={`${baseClass}__list`}>
                  {leaves.map((leaf) => (
                    <li key={leaf.key}>
                      <CheckboxInput
                        checked={isScopedAllowed('globals', slug, leaf.key)}
                        id={`${path}.globals.${slug}.${leaf.key}`}
                        label={leaf.label}
                        onToggle={(e) => toggleScoped('globals', slug, leaf.key, e.target.checked)}
                        tooltip={leaf.description}
                      />
                    </li>
                  ))}
                </ul>
              </Collapsible>
            )
          })}
        </section>
      )}

      {(tools.length > 0 || prompts.length > 0 || resources.length > 0) && (
        <section className={`${baseClass}__section`}>
          <header className={`${baseClass}__section-header`}>
            {/* TODO: needs i18n once design is finalized */}
            <h4>Project-level permissions</h4>
            {/* TODO: needs i18n once design is finalized */}
            <p>Cross-cutting tools, prompts, and resources not scoped to a single collection.</p>
          </header>
          {tools.length > 0 && (
            <Collapsible
              actions={<GroupActions onSetAll={(allow) => setAllFlat('tools', tools, allow)} />}
              className={`${baseClass}__group`}
              header={
                /* TODO: needs i18n once design is finalized */
                <span className={`${baseClass}__group-label`}>Tools</span>
              }
              initCollapsed
            >
              <ul className={`${baseClass}__list`}>
                {tools.map((leaf) => (
                  <li key={leaf.key}>
                    <CheckboxInput
                      checked={isFlatAllowed('tools', leaf.key)}
                      id={`${path}.tools.${leaf.key}`}
                      label={leaf.label}
                      onToggle={(e) => toggleFlat('tools', leaf.key, e.target.checked)}
                      tooltip={leaf.description}
                    />
                  </li>
                ))}
              </ul>
            </Collapsible>
          )}
          {prompts.length > 0 && (
            <Collapsible
              actions={<GroupActions onSetAll={(allow) => setAllFlat('prompts', prompts, allow)} />}
              className={`${baseClass}__group`}
              header={
                /* TODO: needs i18n once design is finalized */
                <span className={`${baseClass}__group-label`}>Prompts</span>
              }
              initCollapsed
            >
              <ul className={`${baseClass}__list`}>
                {prompts.map((leaf) => (
                  <li key={leaf.key}>
                    <CheckboxInput
                      checked={isFlatAllowed('prompts', leaf.key)}
                      id={`${path}.prompts.${leaf.key}`}
                      label={leaf.label}
                      onToggle={(e) => toggleFlat('prompts', leaf.key, e.target.checked)}
                      tooltip={leaf.description}
                    />
                  </li>
                ))}
              </ul>
            </Collapsible>
          )}
          {resources.length > 0 && (
            <Collapsible
              actions={
                <GroupActions onSetAll={(allow) => setAllFlat('resources', resources, allow)} />
              }
              className={`${baseClass}__group`}
              header={
                /* TODO: needs i18n once design is finalized */
                <span className={`${baseClass}__group-label`}>Resources</span>
              }
              initCollapsed
            >
              <ul className={`${baseClass}__list`}>
                {resources.map((leaf) => (
                  <li key={leaf.key}>
                    <CheckboxInput
                      checked={isFlatAllowed('resources', leaf.key)}
                      id={`${path}.resources.${leaf.key}`}
                      label={leaf.label}
                      onToggle={(e) => toggleFlat('resources', leaf.key, e.target.checked)}
                      tooltip={leaf.description}
                    />
                  </li>
                ))}
              </ul>
            </Collapsible>
          )}
        </section>
      )}
    </div>
  )
}

const GroupActions: React.FC<{ onSetAll: (allow: boolean) => void }> = ({ onSetAll }) => (
  // TODO: button labels + aria-labels need i18n once design is finalized
  <div className={`${baseClass}__group-actions`}>
    <button
      aria-label="Select all"
      className={`${baseClass}__action`}
      onClick={(e) => {
        e.stopPropagation()
        onSetAll(true)
      }}
      title="Select all"
      type="button"
    >
      all
    </button>
    <span aria-hidden className={`${baseClass}__action-sep`}>
      /
    </span>
    <button
      aria-label="Clear all"
      className={`${baseClass}__action`}
      onClick={(e) => {
        e.stopPropagation()
        onSetAll(false)
      }}
      title="Clear all"
      type="button"
    >
      none
    </button>
  </div>
)

const titleCase = (slug: string): string =>
  slug.replace(/(^|[-_])(.)/g, (_, sep: string, ch: string) =>
    sep ? ` ${ch.toUpperCase()}` : ch.toUpperCase(),
  )
