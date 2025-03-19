import type { AsyncData, AsyncDataOptions, KeysOf, PickFrom } from '#app/composables/asyncData'
import type { MaybeRefOrGetter } from '#imports'
import type { ClientOptions as OMGOptions } from '@teages/oh-my-graphql'
import type { ClientOptions as WSClientOptions } from 'graphql-ws'
import type { ComputedRef } from 'vue'
import type { TypedDocumentNode } from '../../../types/graphql'
import type { RequireRefOrGetter } from '../../vue'

export type { OMGOptions }

export interface SSEOptions {
  sseOptions?: MaybeRefOrGetter<EventSourceInit>
}

export interface WSOptions {
  wsOptions?: MaybeRefOrGetter<Omit<WSClientOptions, 'url'>>
}

export interface UseGraphQLClientOptions<
  Context,
  SubscriptionContext,
> {
  handler?: RequestHandler<Context> | OMGOptions
  subscription?:
    | ({
      /**
       * Override the default subscription handler.
       * By default it use EventSource
       * - `SubscriptionHandler`: Custom subscription handler.
       * - `ws`: Use websocket handler from package `graphql-ws`.
       * - `sse`: Use default sse handler.
       */
      handler?: 'sse'
    } & SSEOptions)
    | ({
      /**
       * Override the default subscription handler.
       * By default it use EventSource
       * - `SubscriptionHandler`: Custom subscription handler.
       * - `ws`: Use websocket handler from package `graphql-ws`.
       * - `sse`: Use default sse handler.
       */
      handler: 'ws'
    } & WSOptions)
    | {
      /**
       * Override the default subscription handler.
       * By default it use EventSource
       * - `SubscriptionHandler`: Custom subscription handler.
       * - `ws`: Use websocket handler from package `graphql-ws`.
       * - `sse`: Use default sse handler.
       */
      handler: SubscriptionHandler<SubscriptionContext>
    }
}

export type RequestHandler<Context> = <
  TData,
  TVars extends Record<string, unknown>,
> (
  query: {
    document: TypedDocumentNode<TData, TVars>
    variables: NoInfer<TVars>
    type: 'query' | 'mutation'
    url: string
  },
  context?: Context
) => Promise<TData>

export type SubscriptionHandler<Context> = <
  TData,
  TVars extends Record<string, unknown>,
> (
  func: {
    update: (data: TData, isFinal?: boolean) => void
    close: (error?: any) => void
    onUnsubscribe: (fn: () => void) => void
  },
  query: {
    document: TypedDocumentNode<TData, TVars>
    variables: NoInfer<TVars>
    type: 'subscription'
    url: string
  },
  context?: Context
) => void

export interface UseGraphQLClientResult<Context> {
  query: OperationClient<Context>
  mutation: OperationClient<Context>
  defineOperation: DefineOperation<Context>
  defineAsyncQuery: DefineAsyncQuery<Context>
  defineLazyAsyncQuery: DefineAsyncQuery<Context>
  defineSubscription: DefineSubscription<Context>
}

type OperationClientParams<TVars, Context> =
  Record<string, never> extends TVars
    ? [variables?: TVars, context?: Context]
    : [variables: TVars, context?: Context]
export interface OperationClient<Context> {
  <
    TData = Record<string, any>,
    TVars = Record<string, any>,
  >(
    query: TypedDocumentNode<TData, TVars>,
    ...params: OperationClientParams<TVars, Context>
  ): Promise<TData>
}

export interface DefineOperation<Context> {
  <TData, TVars extends Record<string, unknown>>(
    def: TypedDocumentNode<TData, TVars>,
    context?: Context,
  ): DefineOperationReturn<Promise<TData>, TVars, Context>
}

export interface DefineAsyncQuery<Context> {
  <
    TData,
    TVars extends Record<string, unknown>,
    DataT = TData | undefined,
    PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
    DefaultT = null,
  > (
    def: TypedDocumentNode<TData, TVars>,
    context?: Context,
  ): DefineAsyncQueryReturn<
    AsyncData<PickFrom<DataT, PickKeys> | DefaultT, Error | null>,
    TVars,
    AsyncDataOptions<TData | undefined, DataT, PickKeys, DefaultT> & { context?: Context }
  >

  <
    TData,
    TVars extends Record<string, unknown>,
    DataT = TData | undefined,
    PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
    DefaultT = DataT,
  > (
    def: TypedDocumentNode<TData, TVars>,
    context?: Context,
  ): DefineAsyncQueryReturn<
    AsyncData<PickFrom<DataT, PickKeys> | DefaultT, Error | null>,
    TVars,
    AsyncDataOptions<TData | undefined, DataT, PickKeys, DefaultT> & { context?: Context }
  >
}

export interface DefineSubscription<Context> {
  <TData, TVars extends Record<string, unknown>>(
    def: TypedDocumentNode<TData, TVars>,
    context?: Context,
  ): DefineSubscriptionReturn<TData, TVars, Context>
}

export type DefineOperationReturn<Ret, TVars, Context> =
  Record<string, never> extends TVars
    ? (variables?: TVars, context?: Context) => Ret
    : (variables: TVars, context?: Context) => Ret

export type DefineAsyncQueryReturn<Ret, TVars, Options> =
  Record<string, never> extends TVars
    ? DefineAsyncQueryReturnFnE<Ret, TVars, Options>
    : DefineAsyncQueryReturnFn<Ret, TVars, Options>

export interface DefineAsyncQueryReturnFn<Ret, TVars, Options> {
  (
    variables: TVars,
    options?: Omit<Options, 'watch'> // Force to use getter if watched.
  ): Ret
  (
    variables: RequireRefOrGetter<TVars>,
    options?: Options
  ): Ret
}
export interface DefineAsyncQueryReturnFnE<Ret, TVars, Options> {
  (
    variables?: TVars,
    options?: Omit<Options, 'watch'> // Force to use getter if watched.
  ): Ret
  (
    variables?: RequireRefOrGetter<TVars>,
    options?: Options
  ): Ret
}

export type DefineSubscriptionReturn<Ret, TVars, Context> =
  Record<string, never> extends TVars
    ? (variables?: TVars, options?: Context) => Promise<SubscriptionReturn<Ret>>
    : (variables: TVars, options?: Context) => Promise<SubscriptionReturn<Ret>>

export interface SubscriptionReturn<TData> {
  state: ComputedRef<'pending' | 'connected' | 'closed'>
  data: ComputedRef<TData | undefined>
  error: ComputedRef<Error | null>
  unsubscribe: () => void
  /**
   * Close the current subscription and reconnect.
   */
  restart: () => Promise<void>
  /**
   * Keep the current subscription alive and seamless switch to a new one.
   * This is useful when you have a connection time limit.
   */
  refresh: () => Promise<void>
}
