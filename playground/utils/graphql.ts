export type { RequireOperationPartialData } from '#gqfn'

const endpoint = 'https://graphql-test.teages.xyz/graphql-user'

export function api() {
  const schema = useGQFnSchema(endpoint)
  const client = useGraphQLClient(endpoint, {
    handler: {
      preferMethod: 'GET',
      credentials: 'same-origin',
    },
  })

  return { endpoint, schema, client }
}
