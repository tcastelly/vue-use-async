import type { ComputedRef, Ref } from 'vue';

type Obj = { [id: string]: any};

type Func = () => void;

export type XhrConfig = Partial<{
  url?: string;

  timeout?: number | null;

  port?: number | null;

  params?: Obj;

  onStart?: () => void;

  onEnd?: () => void;

  onProgress?: () => void;

  onAbort?: () => void;

  onError?: (e: ProgressEvent) => any;

  sendAs?: 'multipart' | 'json';

  token?: string;

  responseType?: 'arraybuffer' | 'blob',
}>;

interface CancellablePromise<T> extends Promise<T> {
  abortXhr: () => void,
}

export type XhrGet<T> = CancellablePromise<T>;

export type CacheDuration = 'max' | number

export type GetConfig = string | (XhrConfig & Partial<{
  url?: string;

  params?: Obj;

  port?: number | null;

  cacheDuration?: CacheDuration;
}>);

export type GetReturn<T> = {
  isPending: ComputedRef<boolean>,
  data: Ref<T>,
  error: Ref<Error | Obj | null>,
  abort: () => void,
  promise: ComputedRef<Promise<T>>,
  reload: () => void,
  onError: (cb: (Error) => void) => void,
}

export type XhrParams = Partial<{
  url?: string;

  timeout?: number | null;

  port?: number | null;

  params?: Obj;

  onStart?: (e: ProgressEvent) => void;

  onEnd?: (e: ProgressEvent) => void;

  onProgress?: (e: ProgressEvent) => void;

  onAbort?: (e: ProgressEvent) => void;

  onError?: (e: ErrorEvent) => void;

  sendAs?: 'multipart' | 'json';

  token?: string;

  responseType?: 'arraybuffer' | 'blob',
}>
