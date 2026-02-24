'use client'

import type { ClientWidget, FormState } from 'payload'

import {
  Drawer,
  Form,
  FormSubmit,
  OperationProvider,
  RenderFields,
  ShimmerEffect,
  useModal,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import { abortAndIgnore } from '@payloadcms/ui/shared'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'

type WidgetConfigDrawerProps = {
  drawerSlug: string
  onSave: (data: Record<string, unknown>) => void
  widget: ClientWidget
  widgetData?: Record<string, unknown>
}

const EMPTY_WIDGET_PREFERENCES = {
  fields: {},
}

export function WidgetConfigDrawer({
  drawerSlug,
  onSave,
  widget,
  widgetData,
}: WidgetConfigDrawerProps) {
  const { closeModal, modalState } = useModal()
  const { getFormState } = useServerFunctions()
  const { t } = useTranslation()
  const onChangeAbortControllerRef = useRef<AbortController>(null)

  const [initialState, setInitialState] = useState<false | FormState | undefined>(false)

  const isOpen = Boolean(modalState?.[drawerSlug]?.isOpen)
  const formUUID = useMemo(() => uuid(), [])
  const widgetLabel = useMemo(
    () => (typeof widget.label === 'string' ? widget.label : widget.slug),
    [widget.label, widget.slug],
  )
  const fields = useMemo(() => widget.fields ?? [], [widget.fields])

  useEffect(() => {
    if (!isOpen || fields.length === 0) {
      setInitialState(false)
      return
    }

    const controller = new AbortController()

    const loadInitialState = async () => {
      const { state } = await getFormState({
        data: widgetData ?? {},
        docPermissions: {
          fields: true,
        },
        docPreferences: EMPTY_WIDGET_PREFERENCES,
        operation: 'update',
        renderAllFields: true,
        schemaPath: widget.slug,
        signal: controller.signal,
        widgetSlug: widget.slug,
      })

      if (state) {
        setInitialState(state)
      }
    }

    void loadInitialState()

    return () => {
      abortAndIgnore(controller)
    }
  }, [fields, getFormState, isOpen, widget.slug, widgetData])

  const onChange = useCallback(
    async ({ formState: prevFormState }: { formState: FormState }) => {
      abortAndIgnore(onChangeAbortControllerRef.current)

      const controller = new AbortController()
      onChangeAbortControllerRef.current = controller

      const { state } = await getFormState({
        docPermissions: {
          fields: true,
        },
        docPreferences: EMPTY_WIDGET_PREFERENCES,
        formState: prevFormState,
        operation: 'update',
        schemaPath: widget.slug,
        signal: controller.signal,
        widgetSlug: widget.slug,
      })

      if (!state) {
        return prevFormState
      }

      return state
    },
    [getFormState, widget.slug],
  )

  useEffect(() => {
    return () => {
      abortAndIgnore(onChangeAbortControllerRef.current)
    }
  }, [])

  return (
    <Drawer slug={drawerSlug} title={`${t('general:edit')} ${widgetLabel}`}>
      {initialState === false ? (
        <ShimmerEffect height="250px" />
      ) : (
        <OperationProvider operation="update">
          <Form
            fields={fields}
            initialState={initialState}
            onChange={[onChange]}
            onSubmit={(_, data) => {
              onSave(data)
              closeModal(drawerSlug)
            }}
            uuid={formUUID}
          >
            <RenderFields
              fields={fields}
              forceRender
              parentIndexPath=""
              parentPath=""
              parentSchemaPath={widget.slug}
              permissions={true}
              readOnly={false}
            />
            <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
          </Form>
        </OperationProvider>
      )}
    </Drawer>
  )
}
