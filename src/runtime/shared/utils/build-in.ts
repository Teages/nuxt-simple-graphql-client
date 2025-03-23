import type { ClientOptions as OMGClientOptions } from '@teages/oh-my-graphql'
import type { ClientOptions as SSEClientOptions } from 'graphql-sse'
import type { ClientOptions as WSClientOptions } from 'graphql-ws'
import type { GraphQLClient, GraphQLSubscriptionClient } from '../../types/client'
import { print } from '@0no-co/graphql.web'
import { createClient } from '@teages/oh-my-graphql'
import { createClient as createSSEClient } from 'graphql-sse'
import { createClient as createWSClient } from 'graphql-ws'

export interface BuildInClientOptions extends OMGClientOptions {}
export interface BuildInWSClientOptions extends Partial<WSClientOptions> {}
export interface BuildInSSEClientOptions extends Partial<SSEClientOptions> {}

export function createBuildInClient(endpoint: string, buildOptions: BuildInClientOptions): GraphQLClient<BuildInClientOptions> {
  const client = createClient(endpoint, buildOptions)

  return ({ document, variables }, runtimeOptions) =>
    client.request(
      document,
      variables,
      runtimeOptions,
    )
}

export function createBuildInWSClient(
  endpoint: string,
  options?: BuildInWSClientOptions,
): GraphQLSubscriptionClient<never> {
  const client = createWSClient({
    url: endpoint,
    ...options,
  })

  return ({ document, variables }, sink) => {
    const close = client.subscribe({
      query: print(document),
      variables: variables as Record<string, unknown>,
    }, sink)

    return { close }
  }
}

export function createBuildInSSEClient(
  endpoint: string,
  options?: BuildInSSEClientOptions,
): GraphQLSubscriptionClient<never> {
  const client = createSSEClient({
    url: endpoint,
    ...options,
  })

  return ({ document, variables }, sink) => {
    const close = client.subscribe({
      query: print(document),
      variables: variables as Record<string, unknown>,
    }, sink)

    return { close }
  }
}
