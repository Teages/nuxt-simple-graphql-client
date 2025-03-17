const { client, schema } = helloApi

/**
 * Same as:
 * ```graphql
 * query QueryHello($name: String!) {
 *   hello(name: $name)
 * }
 */
export const useAsyncHello = client.defineAsyncQuery(
  schema('query QueryHello', {
    name: 'String',
  }, [{
    hello: $ => $({ name: $.name }, true),
  }]),
)
