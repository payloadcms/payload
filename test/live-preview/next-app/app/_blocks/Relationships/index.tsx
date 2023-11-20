import React, { Fragment } from 'react'

import { Page } from '../../../payload-types'

import classes from './index.module.scss'
import { Gutter } from '@/app/_components/Gutter'
import RichText from '@/app/_components/RichText'

export type RelationshipsBlockProps = {
  blockType: 'relationships'
  blockName: string
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
        <p>Upload:</p>
        {data?.relationshipAsUpload && (
          <div>
            {typeof data?.relationshipAsUpload === 'string'
              ? data?.relationshipAsUpload
              : data?.relationshipAsUpload.filename}
          </div>
        )}
        <p>Rich Text:</p>
        {data?.relationshipInRichText && <RichText content={data.relationshipInRichText} />}
        <p>Monomorphic Has One:</p>
        {data?.relationshipMonoHasOne && (
          <div>
            {typeof data?.relationshipMonoHasOne === 'string'
              ? data?.relationshipMonoHasOne
              : data?.relationshipMonoHasOne.title}
          </div>
        )}
        <p>Monomorphic Has Many:</p>
        {data?.relationshipMonoHasMany?.map(
          (item, index) =>
            item && <div key={index}>{typeof item === 'string' ? item : item.title}</div>,
        )}
        <p>Polymorphic Has One:</p>
        {data?.relationshipPolyHasOne && (
          <div>
            {typeof data?.relationshipPolyHasOne.value === 'string'
              ? data?.relationshipPolyHasOne.value
              : data?.relationshipPolyHasOne.value.title}
          </div>
        )}
        <p>Polymorphic Has Many:</p>
        {data?.relationshipPolyHasMany?.map(
          (item, index) =>
            item.value && (
              <div key={index}>
                {typeof item.value === 'string' ? item.value : item.value.title}
              </div>
            ),
        )}
        <p>Array of Relationships:</p>
        {data?.arrayOfRelationships?.map((item, index) => (
          <div className={classes.array} key={index}>
            <p>Upload:</p>
            {item?.uploadInArray && (
              <div>
                {typeof item?.uploadInArray === 'string'
                  ? item?.uploadInArray
                  : item?.uploadInArray.filename}
              </div>
            )}
            <p>Rich Text:</p>
            {item?.richTextInArray && <RichText content={item.richTextInArray} />}
            <p>Monomorphic Has One:</p>
            {item?.relationshipInArrayMonoHasOne && (
              <div>
                {typeof item?.relationshipInArrayMonoHasOne === 'string'
                  ? item?.relationshipInArrayMonoHasOne
                  : item?.relationshipInArrayMonoHasOne.title}
              </div>
            )}
            <p>Monomorphic Has Many:</p>
            {item?.relationshipInArrayMonoHasMany?.map(
              (rel, relIndex) =>
                rel && <div key={relIndex}>{typeof rel === 'string' ? rel : rel.title}</div>,
            )}
            <p>Polymorphic Has One:</p>
            {item?.relationshipInArrayPolyHasOne && (
              <div>
                {typeof item?.relationshipInArrayPolyHasOne.value === 'string'
                  ? item?.relationshipInArrayPolyHasOne.value
                  : item?.relationshipInArrayPolyHasOne.value.title}
              </div>
            )}
            <p>Polymorphic Has Many:</p>
            {item?.relationshipInArrayPolyHasMany?.map(
              (rel, relIndex) =>
                rel.value && (
                  <div key={relIndex}>
                    {typeof rel.value === 'string' ? rel.value : rel.value.title}
                  </div>
                ),
            )}
          </div>
        ))}
      </Gutter>
    </div>
  )
}
