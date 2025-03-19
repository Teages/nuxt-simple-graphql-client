import type { MaybeRefOrGetter } from '#imports'
import type { ComputedRef } from 'vue'
import type { DefineAsyncQuery, DefineOperation, DefineSubscription, OMGOptions, OperationClient, RequestHandler, SSEOptions, UseGraphQLClientOptions, UseGraphQLClientResult, WSOptions } from '../../types/app/composables/client'
import type { ResultOf, TypedDocumentNode, VariablesOf } from '../../types/graphql'
import { useState } from '#app'
import { useAsyncData } from '#app/composables/asyncData'
import { readonly, toValue, watch } from '#imports'
import { createHandler, createSubscriptionHandler, getDocumentType } from '../../utils/client'

type DefaultSubscriptionHandlerOptions = WSOptions & SSEOptions

export function useGraphQLClient<
  Context = OMGOptions,
  SubscriptionContext = DefaultSubscriptionHandlerOptions,
>(
  endpoint: string,
  options?: UseGraphQLClientOptions<Context, SubscriptionContext>,
): UseGraphQLClientResult<Context> {
  if (!endpoint) {
    throw new Error('endpoint is empty')
  }

  const handler = typeof options?.handler === 'function'
    ? options.handler
    : createHandler({
      ofetch: $fetch as any,
      ...options?.handler,
    }) as RequestHandler<Context>

  const subscriptionHandler = typeof options?.subscription?.handler === 'function'
    ? options.subscription.handler
    : createSubscriptionHandler(options?.subscription ?? {})

  const query: OperationClient<Context> = (document: TypedDocumentNode<any, any>, variables?: any, context?: Context) => {
    const type = getDocumentType(document)
    if (type !== 'query') {
      throw new Error(`Expected a query operation, but got a ${type} operation.`)
    }

    return handler(
      { document, variables, url: endpoint, type },
      context,
    )
  }

  const mutation: OperationClient<Context> = (document: TypedDocumentNode<any, any>, variables?: any, context?: Context) => {
    const type = getDocumentType(document)
    if (type !== 'mutation') {
      throw new Error(`Expected a mutation operation, but got a ${type} operation.`)
    }

    return handler(
      { document, variables, url: endpoint, type },
      context,
    )
  }

  const defineOperation: DefineOperation<Context> = (document, context) => {
    const type = getDocumentType(document)
    if (type === 'subscription') {
      throw new Error('Subscriptions are not supported')
    }

    return (variables?: any, contextRewrite?: any) => handler(
      { document, variables, url: endpoint, type },
      {
        ...context,
        ...contextRewrite,
      },
    )
  }

  const defineAsyncQuery: DefineAsyncQuery<Context> = (document, context) => {
    const type = getDocumentType(document)
    if (type !== 'query') {
      throw new Error('Operation is not a query.')
    }

    return (
      variables?: MaybeRefOrGetter<VariablesOf<typeof document>>,
      options?: any,
    ) => {
      const key = useId()

      return useAsyncData(
        key,
        () => handler(
          {
            document,
            variables: toValue(variables) ?? {} as VariablesOf<typeof document>,
            url: endpoint,
            type,
          },
          {
            ...context,
            ...options?.context,
          },
        ),
        options,
      )
    }
  }

  const defineLazyAsyncQuery: DefineAsyncQuery<Context> = (document, context) => {
    const type = getDocumentType(document)
    if (type !== 'query') {
      throw new Error('Operation is not a query.')
    }

    return (
      variables?: MaybeRefOrGetter<VariablesOf<typeof document>>,
      options?: any,
    ) => {
      const key = useId()

      return useAsyncData(
        key,
        () => handler(
          {
            document,
            variables: toValue(variables) ?? {} as VariablesOf<typeof document>,
            url: endpoint,
            type,
          },
          {
            ...context,
            ...options?.context,
          },
        ),
        {
          lazy: true,
          ...options,
        },
      )
    }
  }

  const defineSubscription: DefineSubscription<Context> = (document, context) => {
    const type = getDocumentType(document)
    if (type !== 'subscription') {
      throw new Error('Operation is not a subscription')
    }

    return async (variables?: any, contextRewrite?: any) => {
      const key = useId()
      const cache = useState<ResultOf<typeof document> | undefined>(key, () => undefined)
      const error = useState<Error | null>(`${key}-error`, () => null)
      const state = useState<'pending' | 'connected' | 'closed'>(`${key}-state`, () => 'pending')

      const hooks = {
        onUnsubscribe: [] as Array<() => void>,
      }

      const close = (e?: any) => {
        state.value = 'closed'
        try {
          hooks.onUnsubscribe.forEach(fn => fn())
        }
        catch (error) { console.error(error) }
        if (e) {
          console.error(e)
        }
      }

      const update = (
        data: ResultOf<typeof document>,
        isFinal: boolean = false,
      ) => {
        if (state.value === 'closed') {
          if (import.meta.dev) {
            console.warn('Subscription is already closed')
          }
          return
        }
        if (state.value === 'pending') {
          state.value = 'connected'
        }

        cache.value = data
        if (isFinal) {
          close()
        }
      }

      const onUnsubscribe = (fn: () => void) => {
        hooks.onUnsubscribe.push(fn)
      }

      const unsubscribe = () => {
        close()
      }

      const restart = () => new Promise<void>((resolve, reject) => {
        // disconnect previous subscription
        if (state.value === 'connected') {
          unsubscribe()
        }

        // if already closed, reset hooks and state
        if (state.value === 'closed') {
          hooks.onUnsubscribe = []
          state.value = 'pending'
        }

        // subscription should only be used in the browser
        // to avoid duplicated requests
        if (!import.meta.client) {
          if (import.meta.dev) {
            console.warn('Subscription is not supported during SSR')
          }
          return resolve()
        }

        // watch the state, resolve the promise when got the first data
        watch(state, (val) => {
          if (val === 'connected') {
            resolve()
          }
        }, { once: true })

        // start the subscription
        error.value = null
        try {
          subscriptionHandler(
            { update, onUnsubscribe, close },
            { document, variables, url: endpoint, type },
            {
              ...context,
              ...contextRewrite,
            },
          )
        }
        catch (error) {
          reject(error)
        }
      })

      const refresh = () => new Promise<void>((resolve, reject) => {
        if (state.value === 'pending') {
          if (import.meta.dev) {
            console.warn('Subscription is not started yet')
          }
          return resolve()
        }
        if (state.value === 'closed') {
          restart()
            .then(() => resolve())
            .catch(reject)
        }

        // dry close
        const oldUnsubscribe = [...hooks.onUnsubscribe]
        state.value = 'closed'

        restart()
          .then(() => {
            resolve()
            // close previous subscription
            try {
              oldUnsubscribe.forEach(fn => fn())
            }
            catch (error) { console.error(error) }
          })
          .catch(reject)
      })

      await restart()

      return {
        state: readonly(state) as ComputedRef<'pending' | 'connected' | 'closed'>,
        data: readonly(cache) as ComputedRef<ResultOf<typeof document> | undefined>,
        error: readonly(error) as ComputedRef<Error | null>,
        unsubscribe,
        refresh,
        restart,
      }
    }
  }

  return {
    query,
    mutation,
    defineOperation,
    defineAsyncQuery,
    defineLazyAsyncQuery,
    defineSubscription,
  }
}
