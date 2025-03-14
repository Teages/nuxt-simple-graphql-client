import type { MaybeRefOrGetter } from '#imports'
import type { DocumentNode } from '@0no-co/graphql.web'
import type { ClientOptions } from '@teages/oh-my-graphql'
import type { ClientOptions as WSClientOptions } from 'graphql-ws'
import type { ResultOf, TypedDocumentNode, VariablesOf } from '../types/graphql'
import { toValue } from '#imports'
import { Kind, print } from '@0no-co/graphql.web'
import { createClient } from '@teages/oh-my-graphql'
import { destr } from 'destr'
import { createClient as createWSClient } from 'graphql-ws'

export function createHandler(options?: HandlerOptions) {
  return async <
    TData,
    TVars extends Record<string, unknown>,
  > (
    query: {
      document: TypedDocumentNode<TData, TVars>
      variables: TVars
      type: 'query' | 'mutation'
      url: string
    },
    context?: HandlerOptions,
  ) => {
    const opts = toValue(options)
    const ctx = toValue(context)

    const headers = {
      ...opts?.headers,
      ...ctx?.headers,
    }

    const preferMethod = ctx?.preferMethod ?? opts?.preferMethod ?? 'POST'

    const res = await createClient(query.url)
      .request(query.document, query.variables, {
        ...opts,
        ...ctx,
        headers,
        preferMethod,
      })
    return res
  }
}

export function createSubscriptionHandler(
  options: CreateSubscriptionHandlerOptions,
): SubscriptionHandler {
  if (options.handler === 'ws') {
    return (func, query, context?: WSOptions) => {
      const ctx = {
        ...toValue(options.options?.wsOptions),
        ...toValue(context?.wsOptions),
      }

      const client = createWSClient({
        ...ctx,
        url: query.url,
      });

      (async () => {
        const subscription = client.iterate<
          ResultOf<typeof query.document>,
          VariablesOf<typeof query.document>
        >({
          query: print(query.document),
          variables: query.variables,
        })
        func.onUnsubscribe(() => {
          subscription.return?.()
        })

        for await (const result of subscription) {
          if (result.data) {
            func.update(result.data)
          }
        }

        func.close()
      })()
    }
  }

  return (func, query, context?: SSEOptions) => {
    const ctx = {
      ...toValue(options.options?.sseOptions),
      ...toValue(context?.sseOptions),
    }

    const url = new URL(query.url)
    url.searchParams.set('query', print(query.document))
    url.searchParams.set('variables', JSON.stringify(query.variables ?? {}))

    const source = new EventSource(url, ctx)
    func.onUnsubscribe(() => {
      source.close()
    })

    source.addEventListener('next', ({ data }) => {
      func.update(
        destr<{ data: ResultOf<typeof query.document> }>(data).data,
      )
    })
    source.addEventListener('error', (e) => {
      func.close(e)
      source.close()
    })
    source.addEventListener('complete', () => {
      func.close()
      source.close()
    })
  }
}

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

export type CreateSubscriptionHandlerOptions = {
  handler?: 'sse'
  options?: SSEOptions
} | {
  handler: 'ws'
  options?: WSOptions
}

export type HandlerOptions = ClientOptions

export interface SSEOptions {
  sseOptions?: MaybeRefOrGetter<EventSourceInit>
}

export interface WSOptions {
  wsOptions?: MaybeRefOrGetter<Omit<WSClientOptions, 'url'>>
}

export type SubscriptionHandler = <
  TData,
  TVars extends Record<string, unknown>,
> (
  func: {
    update: (data: TData) => void
    onUnsubscribe: (fn: () => void) => void
    close: (error?: any) => void
  },
  query: {
    document: TypedDocumentNode<TData, TVars>
    variables: TVars
    type: 'subscription'
    url: string
  },
  context?: any,
) => void
