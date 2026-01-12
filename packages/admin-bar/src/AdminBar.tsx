'use client'
import React, { useEffect, useState } from 'react'

const dummyUser = {
  id: '12345',
  email: 'dev@email.com',
}

import type { PayloadAdminBarProps, PayloadMeUser } from './types.js'

export const PayloadAdminBar: React.FC<PayloadAdminBarProps> = (props) => {
  const {
    id: docID,
    adminPath = '/admin',
    apiPath = '/api',
    authCollectionSlug = 'users',
    className,
    classNames,
    cmsURL = 'http://localhost:8000',
    collectionLabels,
    collectionSlug,
    createProps,
    devMode,
    divProps,
    editProps,
    logo,
    logoProps,
    logoutProps,
    onAuthChange,
    onPreviewExit,
    preview,
    previewProps,
    style,
    unstyled,
    userProps,
  } = props

  const [user, setUser] = useState<PayloadMeUser>()

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const meRequest = await fetch(`${cmsURL}${apiPath}/${authCollectionSlug}/me`, {
          credentials: 'include',
          method: 'get',
        })
        const meResponse = await meRequest.json()
        const { user } = meResponse

        if (user) {
          setUser(user)
        } else {
          if (devMode !== true) {
            setUser(null)
          } else {
            setUser(dummyUser)
          }
        }
      } catch (err) {
        console.warn(err)
        if (devMode === true) {
          setUser(dummyUser)
        }
      }
    }

    void fetchMe()
  }, [cmsURL, adminPath, apiPath, devMode])

  useEffect(() => {
    if (typeof onAuthChange === 'function') {
      onAuthChange(user)
    }
  }, [user, onAuthChange])

  if (user) {
    const { id: userID, email } = user

    return (
      <div
        className={className}
        id="payload-admin-bar"
        style={{
          ...(unstyled !== true
            ? {
                alignItems: 'center',
                backgroundColor: '#222',
                boxSizing: 'border-box',
                color: '#fff',
                display: 'flex',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
                fontSize: 'small',
                left: 0,
                minWidth: '0',
                padding: '0.5rem',
                position: 'fixed',
                top: 0,
                width: '100%',
                zIndex: 99999,
              }
            : {}),
          ...style,
        }}
      >
        <a
          className={classNames?.logo}
          href={`${cmsURL}${adminPath}`}
          {...logoProps}
          style={{
            ...(unstyled !== true
              ? {
                  alignItems: 'center',
                  color: 'inherit',
                  display: 'flex',
                  flexShrink: 0,
                  height: '20px',
                  marginRight: '10px',
                  textDecoration: 'none',
                  ...(logoProps?.style
                    ? {
                        ...logoProps.style,
                      }
                    : {}),
                }
              : {}),
          }}
        >
          {logo || 'Payload CMS'}
        </a>
        <a
          className={classNames?.user}
          href={`${cmsURL}${adminPath}/collections/${authCollectionSlug}/${userID}`}
          rel="noopener noreferrer"
          target="_blank"
          {...userProps}
          style={{
            ...(unstyled !== true
              ? {
                  color: 'inherit',
                  display: 'block',
                  marginRight: '10px',
                  minWidth: '50px',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  ...(userProps?.style
                    ? {
                        ...userProps.style,
                      }
                    : {}),
                }
              : {}),
          }}
        >
          <span
            style={{
              ...(unstyled !== true
                ? {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }
                : {}),
            }}
          >
            {email || 'Profile'}
          </span>
        </a>
        <div
          className={classNames?.controls}
          {...divProps}
          style={{
            ...(unstyled !== true
              ? {
                  alignItems: 'center',
                  display: 'flex',
                  flexGrow: 1,
                  flexShrink: 1,
                  justifyContent: 'flex-end',
                  marginRight: '10px',
                  ...(divProps?.style
                    ? {
                        ...divProps.style,
                      }
                    : {}),
                }
              : {}),
          }}
        >
          {collectionSlug && docID && (
            <a
              className={classNames?.edit}
              href={`${cmsURL}${adminPath}/collections/${collectionSlug}/${docID}`}
              rel="noopener noreferrer"
              target="_blank"
              {...editProps}
              style={{
                display: 'block',
                ...(unstyled !== true
                  ? {
                      color: 'inherit',
                      flexShrink: 1,
                      marginRight: '10px',
                      overflow: 'hidden',
                      textDecoration: 'none',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      ...(editProps?.style
                        ? {
                            ...editProps.style,
                          }
                        : {}),
                    }
                  : {}),
              }}
            >
              <span
                style={{
                  ...(unstyled !== true
                    ? {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }
                    : {}),
                }}
              >
                {`Edit ${collectionLabels?.singular || 'page'}`}
              </span>
            </a>
          )}
          {collectionSlug && (
            <a
              className={classNames?.create}
              href={`${cmsURL}${adminPath}/collections/${collectionSlug}/create`}
              rel="noopener noreferrer"
              target="_blank"
              {...createProps}
              style={{
                ...(unstyled !== true
                  ? {
                      color: 'inherit',
                      display: 'block',
                      flexShrink: 1,
                      overflow: 'hidden',
                      textDecoration: 'none',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      ...(createProps?.style
                        ? {
                            ...createProps.style,
                          }
                        : {}),
                    }
                  : {}),
              }}
            >
              <span
                style={{
                  ...(unstyled !== true
                    ? {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }
                    : {}),
                }}
              >
                {`New ${collectionLabels?.singular || 'page'}`}
              </span>
            </a>
          )}
          {preview && (
            <button
              className={classNames?.preview}
              onClick={onPreviewExit}
              {...previewProps}
              style={{
                ...(unstyled !== true
                  ? {
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      marginLeft: '10px',
                      padding: 0,
                      ...(previewProps?.style
                        ? {
                            ...previewProps.style,
                          }
                        : {}),
                    }
                  : {}),
              }}
              type="button"
            >
              Exit preview mode
            </button>
          )}
        </div>
        <a
          className={classNames?.logout}
          href={`${cmsURL}${adminPath}/logout`}
          rel="noopener noreferrer"
          target="_blank"
          {...logoutProps}
          style={{
            ...(unstyled !== true
              ? {
                  color: 'inherit',
                  display: 'block',
                  flexShrink: 1,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  ...(logoutProps?.style
                    ? {
                        ...logoutProps.style,
                      }
                    : {}),
                }
              : {}),
          }}
        >
          <span
            style={{
              ...(unstyled !== true
                ? {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }
                : {}),
            }}
          >
            Logout
          </span>
        </a>
      </div>
    )
  }

  return null
}
