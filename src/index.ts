import type { ComputedRef, Ref } from 'vue';
import cache, { cacheIds, cacheSize, clearCache } from './cache';
import Deferred from './Deferred';
import useAsync from './useAsync';
import useMutation from './useMutation';
import useResult from './useResult';
import useXhr from './useXhr';
import Xhr from './Xhr';
import useSpinner from './useSpinner';

export type Obj = Record<string, any>;

export type Func = (...args: any[]) => any;

export type UnwrappedPromiseType<T extends (...args: any) => any> =
  T extends (...args: any) => Promise<infer U> ? U :
    T extends (...args: any) => infer U ? U : any;

interface CancellablePromise<T> extends Promise<T> {
  abortXhr: () => void;
}

export type XhrGet<T> = CancellablePromise<T>;

export type CacheDuration = 'max' | number;

export type XhrConfig = Partial<{
  url?: string;

  timeout?: number | null;

  port?: number | null;

  params?: Obj;

  onStart?: (e: ProgressEvent) => void;

  onEnd?: (result: unknown, e: ProgressEvent & {
    currentTarget: XMLHttpRequest;
  }) => void;

  onProgress?: (e: ProgressEvent) => void;

  onAbort?: (e: ProgressEvent) => void;

  onError?: (e: ProgressEvent) => void;

  sendAs?: 'multipart' | 'json';

  token?: null | string;

  responseType?: 'arraybuffer' | 'blob';
}>;

type GetConfigArgsWithoutParams = Omit<XhrConfig, 'params'>;

export type $UpdateConfigArgs<T = object> = (GetConfigArgsWithoutParams & Partial<{
  params: T;
}>);

export type $GetConfigArgs<T = object> = (Omit<GetConfigArgsWithoutParams, 'url'> & Partial<{
  cacheDuration: CacheDuration;

  url: string | ((params?: T) => string) | ComputedRef<string>;

  params: T;

  enabled: undefined | null | (() => boolean) | boolean | ComputedRef<boolean> | Ref<boolean>;
}>);

export type $GetConfig<T> = string | $GetConfigArgs<T>;

export type GetConfig<T> = $GetConfig<T> | Ref<$GetConfig<T>>;

export type TypeAllowed = undefined | null | string | number | boolean | Obj;

type Params<Z, A extends unknown[]> = (() => (Z | [...A])) |
  ComputedRef<Z | [...A]> |
  Ref<Z | [...A]> |
  Z |
  [...A];

export type RequiredParams<Z extends TypeAllowed, A extends TypeAllowed[]> = Params<Z, A>;

export interface GetReturn<T> {
  isPending: ComputedRef<undefined | boolean>;
  data: ComputedRef<T>;
  error: Ref<null | Error | Obj>;
  abort: () => void;
  promise: ComputedRef<Promise<T>>;
  reload: () => void;
  onError: (cb: (e: Error, xhr: Xhr<T>) => void) => void;
  onStart: (cb: (params: any, xhr: Xhr<T>) => any) => any;
  onEnd: (cb: (res: T, params: any, xhr: Xhr<T>) => any) => any;
  xhr: Xhr<T>;
}

export {
  cache,
  clearCache,
  cacheSize,
  cacheIds,
  Deferred,
  useAsync,
  useMutation,
  useResult,
  useXhr,
  Xhr,
  useSpinner,
};
