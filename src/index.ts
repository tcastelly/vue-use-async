import type { ComputedRef, Ref } from 'vue';
import cache, { cacheSize, clearCache } from './cache';
import Deferred from './Deferred';
import useAsync from './useAsync';
import useMutation from './useMutation';
import useResult from './useResult';
import useXhr from './useXhr';
import Xhr from './Xhr';
import useSpinner from './useSpinner';

export type Obj = { [id: string]: any };

export type Func = (...args: any[]) => any;

export type UnwrappedPromiseType<T extends (...args: any) => any> =
  T extends (...args: any) => Promise<infer U> ? U :
    T extends (...args: any) => infer U ? U : any

interface CancellablePromise<T> extends Promise<T> {
  abortXhr: () => void,
}

export type XhrGet<T> = CancellablePromise<T>;

export type CacheDuration = 'max' | number

export type XhrConfig = Partial<{
  url?: string;

  timeout?: number | null;

  port?: number | null;

  params?: Obj;

  onStart?: (e: ProgressEvent) => void;

  onEnd?: (e: ProgressEvent) => void;

  onProgress?: (e: ProgressEvent) => void;

  onAbort?: (e: ProgressEvent) => void;

  onError?: (e: ProgressEvent) => void;

  sendAs?: 'multipart' | 'json';

  token?: null | string;

  responseType?: 'arraybuffer' | 'blob',
}>

export type $GetConfig = string | (XhrConfig & Partial<{
  cacheDuration?: CacheDuration;

  url: string | ComputedRef<string>,

  params?: Obj | ComputedRef<Obj>,

  enabled?: undefined | null | (() => boolean) | boolean | ComputedRef<boolean> | Ref<boolean>,
}>);

export type GetConfig = $GetConfig | Ref<$GetConfig>

export type GetReturn<T> = {
  isPending: ComputedRef<undefined | boolean>,
  data: Ref<T>,
  error: Ref<null | Error | Obj>,
  abort: () => void,
  promise: ComputedRef<Promise<T>>,
  reload: () => void,
  onError: (cb: (e: Error, xhr: Xhr<T>) => void) => void,
  onStart: (cb: (params: any, xhr: Xhr<T>) => any) => any,
  onEnd: (cb: (res: T, params: any, xhr: Xhr<T>) => any) => any,
  xhr: Xhr<T>,
}

export {
  cache,
  clearCache,
  cacheSize,
  Deferred,
  useAsync,
  useMutation,
  useResult,
  useXhr,
  Xhr,
  useSpinner,
};
