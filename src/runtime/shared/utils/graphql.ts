import type { DocumentNode } from '@0no-co/graphql.web'
import { Kind } from '@0no-co/graphql.web'

export function getDocumentType(doc: DocumentNode) {
  let type: 'query' | 'mutation' | 'subscription' | undefined

  doc.definitions.forEach((def) => {
    if (def.kind === Kind.OPERATION_DEFINITION) {
      if (type !== undefined) {
        throw new Error('Multiple operation definitions in document')
      }
      type = def.operation
    }
  })

  if (!type) {
    throw new Error('Unrecognizable document type')
  }

  return type
}
