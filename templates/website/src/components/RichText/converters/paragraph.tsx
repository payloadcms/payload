import type { SerializedParagraphNode } from '@payloadcms/richtext-lexical'
import type { JSXConverters } from '@payloadcms/richtext-lexical/react'

export const ParagraphJSXConverter: JSXConverters<SerializedParagraphNode> = {
    paragraph: ({ node, nodesToJSX }) => {
        const children = nodesToJSX({
            nodes: node.children,
        })

        if (!children?.length) {
            return (
                <br />
            )
        }

        return <p>{children}</p>
    },
}
