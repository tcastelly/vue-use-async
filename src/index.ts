import type { ComputedRef, Ref } from '@vue/composition-api';
import cache, { cacheSize, clearCache } from './cache';
import Deferred from './Deferred';
import useAsync from './useAsync';
import useMutation from './useMutation';
import useResult from './useResult';
import useXhr from './useXhr';
import Xhr from './Xhr';
import useSpinner from './useSpinner';

export type Obj = { [id: string]: any };

export type Func = (...any) => any;

export type UnwrappedPromiseType <T extends (...args: any) => any> =
  T extends (...args: any) => Promise<infer U> ? U :
    T extends (...args: any) => infer U ? U : any

interface CancellablePromise<T> extends Promise<T> {
  abortXhr: () => void,
}

export type XhrGet<T> = CancellablePromise<T>;

export type CacheDuration = 'max' | number

export type XhrConfig<T = any> = Partial<{
  url?: string;

  timeout?: number | null;

  port?: number | null;

  params?: Obj;

  onStart?: (e: ProgressEvent, xhr: Xhr<T>) => void;

  onEnd?: (e: ProgressEvent, xhr: Xhr<T>) => void;

  onProgress?: (e: ProgressEvent, xhr: Xhr<T>) => void;

  onAbort?: (e: ProgressEvent, xhr: Xhr<T>) => void;

  onError?: (e: ErrorEvent, xhr: Xhr<T>) => void;

  sendAs?: 'multipart' | 'json';

  token?: string;

  responseType?: 'arraybuffer' | 'blob',
}>

export type $GetConfig = string | (XhrConfig & Partial<{
  cacheDuration?: CacheDuration;

  url: string | ComputedRef<string>,

  params?: Obj | ComputedRef<Obj>,

  enabled?: boolean | ComputedRef<boolean>,
}>);

export type GetConfig = $GetConfig | Ref<$GetConfig>

export type GetReturn<T> = {
  isPending: ComputedRef<boolean>,
  data: Ref<T>,
  error: Ref<Error | Obj | null>,
  abort: () => void,
  promise: ComputedRef<Promise<T>>,
  reload: () => void,
  onError: (cb: (e: Error, xhr: Xhr<T>) => void) => void,
  onStart?: (cb: (params: any, xhr: Xhr<T>) => any) => any,
  onEnd?: (cb: (res: T, params: any, xhr: Xhr<T>) => any) => any,
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
