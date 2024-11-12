import React, { Fragment } from 'react'

import type { Page } from '../../../../../payload-types.js'

import { Gutter } from '../../_components/Gutter/index.js'
import RichText from '../../_components/RichText/index.js'
import classes from './index.module.scss'

export type RelationshipsBlockProps = {
  blockName: string
  blockType: 'relationships'
  data: Page
}

export const RelationshipsBlock: React.FC<RelationshipsBlockProps> = (props) => {
  const { data } = props

  return (
    <div className={classes.relationshipsBlock}>
      <Gutter>
        <p>
          This block is for testing purposes only. It renders every possible type of relationship.
        </p>
        <p>
          <b>Rich Text — Slate:</b>
        </p>
        {data?.richTextSlate && <RichText content={data.richTextSlate} renderUploadFilenameOnly />}
        <p>
          <b>Rich Text — Lexical:</b>
        </p>
        {data?.richTextLexical && (
          <RichText content={data.richTextLexical} renderUploadFilenameOnly serializer="lexical" />
        )}
        <p>
          <b>Upload:</b>
        </p>
        {data?.relationshipAsUpload ? (
          <div>
            {typeof data?.relationshipAsUpload === 'string'
              ? data?.relationshipAsUpload
              : data?.relationshipAsUpload.filename}
          </div>
        ) : (
          <div>None</div>
        )}
        <p>
          <b>Monomorphic Has One:</b>
        </p>
        {data?.relationshipMonoHasOne ? (
          <div>
            {typeof data?.relationshipMonoHasOne === 'string'
              ? data?.relationshipMonoHasOne
              : data?.relationshipMonoHasOne.title}
          </div>
        ) : (
          <div>None</div>
        )}
        <p>
          <b>Monomorphic Has Many:</b>
        </p>
        {data?.relationshipMonoHasMany ? (
          <Fragment>
            {data?.relationshipMonoHasMany.length
              ? data?.relationshipMonoHasMany?.map((item, index) =>
                  item ? (
                    <div key={index}>{typeof item === 'string' ? item : item.title}</div>
                  ) : (
                    'null'
                  ),
                )
              : 'None'}
          </Fragment>
        ) : (
          <div>None</div>
        )}
        <p>
          <b>Polymorphic Has One:</b>
        </p>
        {data?.relationshipPolyHasOne ? (
          <div>
            {typeof data?.relationshipPolyHasOne.value === 'string'
              ? data?.relationshipPolyHasOne.value
              : data?.relationshipPolyHasOne.value.title}
          </div>
        ) : (
          <div>None</div>
        )}
        <p>
          <b>Polymorphic Has Many:</b>
        </p>
        {data?.relationshipPolyHasMany ? (
          <Fragment>
            {data?.relationshipPolyHasMany.length
              ? data?.relationshipPolyHasMany?.map((item, index) =>
                  item.value ? (
                    <div key={index}>
                      {typeof item.value === 'string' ? item.value : item.value.title}
                    </div>
                  ) : (
                    'null'
                  ),
                )
              : 'None'}
          </Fragment>
        ) : (
          <div>None</div>
        )}
        <p>
          <b>Array of Relationships:</b>
        </p>
        {data?.arrayOfRelationships?.map((item, index) => (
          <div className={classes.array} key={index}>
            <p>
              <b>Rich Text:</b>
            </p>
            {item?.richTextInArray && <RichText content={item.richTextInArray} />}
            <p>
              <b>Upload:</b>
            </p>
            {item?.uploadInArray ? (
              <div>
                {typeof item?.uploadInArray === 'string'
                  ? item?.uploadInArray
                  : item?.uploadInArray.filename}
              </div>
            ) : (
              <div>None</div>
            )}
            <p>
              <b>Monomorphic Has One:</b>
            </p>
            {item?.relationshipInArrayMonoHasOne ? (
              <div>
                {typeof item?.relationshipInArrayMonoHasOne === 'string'
                  ? item?.relationshipInArrayMonoHasOne
                  : item?.relationshipInArrayMonoHasOne.title}
              </div>
            ) : (
              <div>None</div>
            )}
            <p>
              <b>Monomorphic Has Many:</b>
            </p>
            {item?.relationshipInArrayMonoHasMany ? (
              <Fragment>
                {item?.relationshipInArrayMonoHasMany.length
                  ? item?.relationshipInArrayMonoHasMany?.map((rel, relIndex) =>
                      rel ? (
                        <div key={relIndex}>{typeof rel === 'string' ? rel : rel.title}</div>
                      ) : (
                        'null'
                      ),
                    )
                  : 'None'}
              </Fragment>
            ) : (
              <div>None</div>
            )}
            <p>
              <b>Polymorphic Has One:</b>
            </p>
            {item?.relationshipInArrayPolyHasOne ? (
              <div>
                {typeof item?.relationshipInArrayPolyHasOne.value === 'string'
                  ? item?.relationshipInArrayPolyHasOne.value
                  : item?.relationshipInArrayPolyHasOne.value.title}
              </div>
            ) : (
              <div>None</div>
            )}
            <p>
              <b>Polymorphic Has Many:</b>
            </p>
            {item?.relationshipInArrayPolyHasMany ? (
              <Fragment>
                {item?.relationshipInArrayPolyHasMany.length
                  ? item?.relationshipInArrayPolyHasMany?.map((rel, relIndex) =>
                      rel.value ? (
                        <div key={relIndex}>
                          {typeof rel.value === 'string' ? rel.value : rel.value.title}
                        </div>
                      ) : (
                        'null'
                      ),
                    )
                  : 'None'}
              </Fragment>
            ) : (
              <div>None</div>
            )}
          </div>
        ))}
      </Gutter>
    </div>
  )
}
