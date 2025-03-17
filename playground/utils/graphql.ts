export type { RequireOperationPartialData } from '#gqfn'

const endpoint = 'https://graphql-test.teages.xyz/graphql-user'
const schema = useGQFnSchema(endpoint)
const client = useGraphQLClient(endpoint, {
  handler: {
    preferMethod: 'GET',
    credentials: 'same-origin',
  },
})

export const helloApi = { schema, client }
