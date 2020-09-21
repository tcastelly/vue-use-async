import type { ComputedRef, Ref } from 'vue';

interface CancellablePromise<T> extends Promise<T> {
  abortXhr: Function
}

export type XhrGet<T> = CancellablePromise<T>;

export type CacheDuration = 'max'| number

export type GetConfig = string | (XhrConfig & Partial<{
  url?: string;

  params?: Object;

  port?: number | null;

  cacheDuration?: CacheDuration;
}>);

export type GetReturn<T> = {
  isPending: ComputedRef<boolean>,
  data: Ref<T>,
  error: Ref<Error | Object | null>,
  abort: Function,
  promise: ComputedRef<Promise<T>>,
  reload: Function,
  onError: (cb: (Error) => void) => void,
}

export type XhrConfig = Partial<{
  url?: string;

  timeout?: number | null;

  port?: number | null;

  params?: Object;

  onStart?: Function;

  onEnd?: Function;

  onProgress?: Function;

  onAbort?: Function;

  onError?: (e: ProgressEvent) => any;

  sendAs?: 'multipart' | 'json';

  token?: string;

  responseType?: 'arraybuffer' | 'blob',
}>;

export type XhrParams = Partial<{
  url?: string;

  timeout?: number | null;

  port?: number | null;

  params?: Object;

  onStart?: (e: ProgressEvent) => void;

  onEnd?: (e: ProgressEvent) => void;

  onProgress?: (e: ProgressEvent) => void;

  onAbort?: (e: ProgressEvent) => void;

  onError?: (e: ProgressEvent) => void;

  sendAs?: 'multipart' | 'json';

  token?: string;

  responseType?: 'arraybuffer' | 'blob',
}>
