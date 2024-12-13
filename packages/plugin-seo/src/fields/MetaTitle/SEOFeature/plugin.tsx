'use client'

import { useTranslation } from '@payloadcms/ui'
import React from 'react'

export const SEOPlugin = () => {
  const { t } = useTranslation<any, any>()

  return (
    <div
      style={{
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          marginBottom: '5px',
          position: 'relative',
        }}
      >
        <div className="plugin-seo__field">
          {false && (
            <React.Fragment>
              &nbsp; &mdash; &nbsp;
              <button
                disabled={false}
                onClick={() => {
                  // void regenerateTitle()
                }}
                style={{
                  background: 'none',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'currentcolor',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
                type="button"
              >
                {t('plugin-seo:autoGenerate')}
              </button>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  )
}
