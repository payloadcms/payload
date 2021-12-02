import React, {
  CSSProperties,
  ReactElement,
  useEffect,
  useState
} from 'react';

const dummyUser = {
  email: 'dev@email.com',
  id: '12345'
}

export type PayloadMeUser = {
  email: string
  id: string
} | null | undefined

export type PayloadAdminBarProps = {
  cmsURL?: string
  adminPath?: string
  apiPath?: string
  collection?: string
  collectionLabels?: {
    singular?: string,
    plural?: string
  }
  id?: string
  logo?: ReactElement
  className?: string
  classNames?: {
    user?: string,
    logo?: string,
    create?: string,
    logout?: string,
    controls?: string,
    edit?: string,
    preview?: string
  }
  logoProps?: {
    style?: CSSProperties
    [key: string]: unknown
  }
  divProps?: {
    style?: CSSProperties
    [key: string]: unknown
  }
  editProps?: {
    style?: CSSProperties
    [key: string]: unknown
  }
  createProps?: {
    style?: CSSProperties
    [key: string]: unknown
  }
  userProps?: {
    style?: CSSProperties
    [key: string]: unknown
  }
  logoutProps?: {
    style?: CSSProperties
    [key: string]: unknown
  }
  previewProps?: {
    style?: CSSProperties
    [key: string]: unknown
  }
  style?: CSSProperties
  unstyled?: boolean
  onAuthChange?: (user: PayloadMeUser) => void
  devMode?: boolean
  preview?: boolean
  onPreviewExit?: () => void
}

export const PayloadAdminBar: React.FC<PayloadAdminBarProps> = (props) => {
  const {
    cmsURL = 'http://localhost:8000',
    apiPath = '/api',
    adminPath = '/admin',
    collection,
    collectionLabels,
    id,
    logo,
    className,
    logoProps,
    editProps,
    createProps,
    userProps,
    logoutProps,
    divProps,
    style,
    unstyled,
    onAuthChange,
    classNames,
    devMode,
    preview,
    onPreviewExit,
    previewProps
  } = props;

  const [user, setUser] = useState<PayloadMeUser>();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const meRequest = await fetch(`${cmsURL}${apiPath}/users/me`, {
          method: 'get',
          credentials: 'include',
        });
        const meResponse = await meRequest.json();
        const { user } = meResponse;

        if (user) {
          setUser(user);
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
    fetchMe();
  }, [
    cmsURL,
    adminPath,
    apiPath
  ])

  useEffect(() => {
    if (typeof onAuthChange === 'function') {
      onAuthChange(user)
    }
  }, [
    user,
    onAuthChange
  ])

  if (user) {
    const {
      email,
      id: userID
    } = user;

    return (
      <div
        className={className}
        style={{
          ...unstyled !== true ? {
            fontSize: 'small',
            position: 'fixed',
            display: 'flex',
            minWidth: '0',
            alignItems: 'center',
            top: 0,
            left: 0,
            width: '100%',
            padding: '0.5rem',
            zIndex: 99999,
            boxSizing: 'border-box',
            backgroundColor: '#222',
            color: '#fff',
            fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif'
          } : {},
          ...style
        }}
      >
        <a
          href={`${cmsURL}${adminPath}`}
          className={classNames?.logo}
          {...logoProps}
          style={{
            ...unstyled !== true ? {
              marginRight: '10px',
              flexShrink: 0,
              display: 'flex',
              height: '20px',
              textDecoration: 'none',
              color: 'inherit',
              alignItems: 'center',
              ...logoProps?.style ? {
                ...logoProps.style
              } : {}
            } : {}
          }}
        >
          {logo || 'Payload CMS'}
        </a>
        {email && (
          <a
            href={`${cmsURL}${adminPath}/collections/users/${userID}`}
            target="_blank"
            rel="noopener noreferrer"
            className={classNames?.user}
            {...userProps}
            style={{
              ...unstyled !== true ? {
                marginRight: '10px',
                display: 'block',
                minWidth: '50px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                color: 'inherit',
                ...userProps?.style ? {
                  ...userProps.style
                } : {}
              } : {}
            }}
          >
            <span
              style={{
                ...unstyled !== true ? {
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                } : {}
              }}
            >
              {email}
            </span>
          </a>
        )}
        {(collection || id) && (
          <div
            className={classNames?.controls}
            {...divProps}
            style={{
              ...unstyled !== true ? {
                display: 'flex',
                flexShrink: 1,
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                ...divProps?.style ? {
                  ...divProps.style
                } : {}
              } : {}
            }}
          >
            {collection && id && (
              <a
                href={`${cmsURL}${adminPath}/collections/${collection}/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={classNames?.edit}
                {...editProps}
                style={{
                  display: 'block',
                  ...unstyled !== true ? {
                    marginRight: '10px',
                    textDecoration: 'none',
                    color: 'inherit',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    flexShrink: 1,
                    ...editProps?.style ? {
                      ...editProps.style
                    } : {}
                  } : {}
                }}
              >
                <span
                  style={{
                    ...unstyled !== true ? {
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    } : {}
                  }}
                >
                  {`Edit ${collectionLabels?.singular || 'page'}`}
                </span>
              </a>
            )}
            {collection && (
              <a
                href={`${cmsURL}${adminPath}/collections/${collection}/create`}
                target="_blank"
                rel="noopener noreferrer"
                className={classNames?.create}
                {...createProps}
                style={{
                  ...unstyled !== true ? {
                    marginRight: '10px',
                    flexShrink: 1,
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    ...createProps?.style ? {
                      ...createProps.style
                    } : {}
                  } : {}
                }}
              >
                <span
                  style={{
                    ...unstyled !== true ? {
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    } : {}
                  }}
                >
                  {`New ${collectionLabels?.singular || 'page'}`}
                </span>
              </a>
            )}
            <a
              href={`${cmsURL}${adminPath}/logout`}
              target="_blank"
              rel="noopener noreferrer"
              className={classNames?.logout}
              {...logoutProps}
              style={{
                ...unstyled !== true ? {
                  textDecoration: 'none',
                  color: 'inherit',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  display: 'block',
                  flexShrink: 1,
                  ...logoutProps?.style ? {
                    ...logoutProps.style
                  } : {}
                } : {}
              }}
            >
              <span
                style={{
                  ...unstyled !== true ? {
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  } : {}
                }}
              >
                Logout
              </span>
            </a>
          </div>
        )}
        {preview && (
          <button
            className={classNames?.preview}
            {...previewProps}
            onClick={onPreviewExit}
            style={{
              ...unstyled !== true ? {
                marginLeft: '10px',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: 'inherit',
              } : {}
            }}
          >
            <span>
              Exit preview mode
            </span>
          </button>
        )}
      </div>
    )
  }

  return null;
}
