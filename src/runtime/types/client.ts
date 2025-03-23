import type { TypedDocumentNode } from '@teages/oh-my-graphql'

export interface GraphQLRequest<TData, TVars> {
  operationName?: string
  document: TypedDocumentNode<TData, TVars>
  variables: TVars
  extensions?: Record<string, unknown>
}

export interface GraphQLClientBuilder<TContext = unknown> {
  (endpoint: string): GraphQLClient<TContext>
}

export interface GraphQLClient<TContext> {
  <TData, TVars>(
    request: GraphQLRequest<TData, TVars>,
    context?: TContext
  ): Promise<TData>
}

export interface GraphQLSubscriptionClientBuilder<TContext = unknown> {
  (endpoint: string): GraphQLSubscriptionClient<TContext>
}

export interface GraphQLSubscriptionResult<TData> {
  errors?: ReadonlyArray<import('graphql').GraphQLFormattedError>
  data?: TData | null
  hasNext?: boolean
  extensions?: Record<string, unknown>
}

export interface GraphQLSubscriptionSink<TData> {
  next: (value: GraphQLSubscriptionResult<TData>) => void
  error: (error: unknown) => void
  complete: () => void
}

export interface GraphQLSubscriptionController {
  close: () => void
}

export interface GraphQLSubscriptionClient<TContext> {
  <TData, TVars>(
    request: GraphQLRequest<TData, TVars>,
    sink: GraphQLSubscriptionSink<TData>,
    context?: TContext
  ): GraphQLSubscriptionController
}

export {}
