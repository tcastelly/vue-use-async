import type { ComputedRef, Ref } from 'vue';
import {
  computed,
  isRef,
  onBeforeUnmount,
  ref,
  unref,
  watch,
} from 'vue';
import uuid from '@/_base/uuid';
import type {
  $GetConfigArgs,
  $UpdateConfigArgs,
  CacheDuration,
  GetConfig,
  GetReturn,
  Obj,
  RequiredParams,
  TypeAllowed,
  XhrConfig,
  XhrGet,
} from './index';
import Xhr from './Xhr';
import cache from './cache';
import useAsync from './useAsync';
import { Result } from './useResult';

type Enabled = undefined | null | (() => boolean) | Ref<boolean> | ComputedRef<boolean> | boolean;

type Token = Ref<string | null> | ComputedRef<string | null> | string | null

type OnErrorCb<T> = (e: Error, xhr: Xhr<T>) => unknown

type OnStartCb<T, Z> = (params: Z, xhr: Xhr<T>) => unknown

type OnEndCb<T, Z> = (res: T, params: Z, xhr: Xhr<T>) => unknown

// override url to have string used by Xhr
type $$GetConfigArg<T> = Omit<$GetConfigArgs<T>, 'url'> & {
  url?: string,
}

// used as default `onError`
const _blank = () => {
};

declare type UseXhr<
  T,
  Z extends TypeAllowed,
  A extends TypeAllowed[],
  F extends ((...args: A) => Promise<T>) | ((args: Z) => Promise<T>),
  P extends RequiredParams<Parameters<F>[0], A>
> = Partial<{
  // global callback for VueJS 2 plugin compatibility
  onError: (cb: OnErrorCb<P>) => unknown,
  onStart: OnStartCb<T, P>,
  onEnd: OnEndCb<T, P>,
  onProgress: (e: ProgressEvent) => any,
  onAbort: (e: ProgressEvent) => any,
  //
  context: any;
  legacy: boolean;
  token: Token;
}>;

const getTokenValue = (token: undefined | Token): undefined | null | string => unref<undefined | string | null>(token);

export default function <
  T,
  Z extends TypeAllowed,
  A extends TypeAllowed[],
  F extends ((..._args: A) => Promise<T>) | ((_args: Z) => Promise<T>),
  P extends RequiredParams<Parameters<F>[0], A>
>(args?: UseXhr<T, Z, A, F, P>) {
  const {
    onError,
    onStart,
    onEnd,
    context,
    legacy,
    token = null,
  } = (args || {
    onError: () => {
    },
    onStart: () => {
    },
    onEnd: () => {
    },
    context: null,
    legacy: false,
    token: null,
  });

  const xhrList = ref<Array<Xhr<any>>>([]);

  const unwatch: Array<() => unknown> = [];

  /**
   * For GET it's possible to add cache
   */
  function get<
    TT = T,
    ZZ extends TypeAllowed = Z,
    AA extends TypeAllowed[] = A,
  >(
    parametersObj: GetConfig<ZZ>,
    params?: RequiredParams<ZZ, AA>,
    enabled?: Enabled,
  ): GetReturn<TT> {
    const xhr: Xhr<TT> = new Xhr<TT>();

    const _onError = (onError || _blank).bind(context);
    const _onStart = (onStart || _blank).bind(context);
    const _onEnd = (onEnd || _blank).bind(context);

    const onErrorList: OnErrorCb<TT>[] = [_onError as unknown as OnErrorCb<TT>];
    const onStartList: OnStartCb<TT, ZZ>[] = [_onStart as unknown as OnStartCb<TT, ZZ>];
    const onEndList: OnEndCb<TT, ZZ>[] = [_onEnd as unknown as OnEndCb<TT, ZZ>];

    const error = ref<null | Error | Obj>(null);

    xhrList.value.push(xhr);

    const isPending = ref<undefined | boolean>();

    const data = ref<TT>();

    let url: undefined | string = '';
    let duration: undefined | CacheDuration = 0;

    const getParams = computed(() => {
      const _getParams: $$GetConfigArg<ZZ> = {};

      const unwrapParametersObj = unref(parametersObj);

      let _url: $GetConfigArgs<ZZ>['url'];

      if (typeof unwrapParametersObj === 'string') {
        _url = unwrapParametersObj;
      } else {
        _url = unref(unwrapParametersObj.url);

        // use params from second args of get function
        if (!params) {
          params = (unwrapParametersObj.params || {}) as RequiredParams<ZZ, AA>;
        }

        duration = unwrapParametersObj.cacheDuration;

        if (unwrapParametersObj.enabled !== undefined) {
          _getParams.enabled = unwrapParametersObj.enabled;
        }

        if (_getParams.enabled === undefined) {
          _getParams.enabled = enabled;
        }

        _getParams.params = unref<ZZ>(params as ZZ);
        _getParams.cacheDuration = duration;
      }

      if (token) {
        _getParams.token = getTokenValue(token);
      }

      // merge params
      let p: object = unref((_getParams.params || params || {}) as object);
      if (typeof p === 'function') {
        p = (p as () => object)();
      }

      _getParams.params = ({
        ...p,
        ...((isRef(params) ? (params.value || {}) : params) as object),
      }) as ZZ;

      url = typeof _url === 'function' ? _url(_getParams.params) : unref(_url);
      _getParams.url = url;

      return _getParams;
    });

    const isEnabled = () => {
      const _exec: Enabled = getParams.value.enabled !== undefined ? getParams.value.enabled : enabled;

      if (_exec === undefined) {
        return true;
      }
      if (isRef(_exec)) {
        return unref(_exec);
      }
      if (typeof _exec === 'function') {
        return _exec();
      }
      return _exec === true;
    };

    const xhrPromise = ref<XhrGet<TT>>();

    const reload = () => {
      if (!isEnabled()) {
        return;
      }

      if (isPending.value) {
        xhr.abort();
      }

      const xhrParams = typeof getParams.value.params === 'object' ? getParams.value.params : {} as ZZ;

      onStartList.forEach((cb) => cb(xhrParams, xhr));

      isPending.value = true;
      error.value = null;

      const lastCacheId = decodeURIComponent(Xhr.stringifyUrl(
        String(url),
        xhrParams as object,
      ));

      // Preserve function extended in promise (abort)
      xhrPromise.value = cache<TT>({
        id: lastCacheId,
        xhr: xhr.get.bind(xhr, getParams.value as object),
        duration,
      });

      // don t need to abort later, remove the xhr from the list
      const removeHttpXhrList = () => {
        const httpXhrIndex = xhrList.value.indexOf(xhr);
        if (httpXhrIndex > -1) {
          xhrList.value.splice(httpXhrIndex, 1);
        }
      };

      xhrPromise.value.catch((err) => {
        onErrorList.forEach((cb) => cb(err, xhr));
        error.value = err;
      });

      xhrPromise.value.then((_data) => {
        data.value = _data;
      });

      xhrPromise.value.finally(() => {
        removeHttpXhrList();
        isPending.value = false;
        onEndList.forEach((cb) => cb(data.value as TT, xhrParams, xhr));
      });
    };

    // reload if parameters changed
    unwatch.push(watch(
      () => getParams.value,
      reload,
      {
        immediate: isEnabled(),
        deep: true,
      },
    ));

    unwatch.push(watch(
      () => error.value,
      (err) => {
        if (err) {
          throw err;
        }
      },
    ));

    return {
      // set variable in ro
      isPending: computed(() => isPending.value),

      // set variable in ro only for TS
      data: computed({
        get: () => data.value,
        set: (v: typeof data.value | Result<typeof data.value>) => {
          // variable updated by `useResult`
          if (v instanceof Result && v.uuid === uuid) {
            data.value = v as typeof data.value;
          } else {
            console.warn('"useXhr" update a readonly field is not allowed');
            data.value = v as typeof data.value;
          }
        },
      }) as ComputedRef,

      onError: (cb) => onErrorList.push(cb),
      onStart: (cb) => onStartList.push(cb),
      onEnd: (cb) => onEndList.push(cb),
      error,
      abort: () => xhrPromise.value?.abortXhr(),
      promise: computed(() => xhrPromise.value || new Promise(() => {
      })),
      reload,
      xhr,
    };
  }

  const update = <TT = T, ZZ extends TypeAllowed = Z, AA extends TypeAllowed[] = A>(
    method: 'post' | 'delete' | 'put',
    xhrConfig?: $UpdateConfigArgs,
    params?: RequiredParams<ZZ, AA>,
  ) => {
    const updateArgs = computed(() => {
      const _postArgs: $UpdateConfigArgs<ZZ> = {};

      const unwrapParametersObj = unref(xhrConfig || {} as XhrConfig);

      // use params from second args of post function
      if (!params) {
        params = (unwrapParametersObj.params || {}) as RequiredParams<ZZ, AA>;
      }
      _postArgs.params = unref<ZZ>(params as ZZ);

      if (token) {
        _postArgs.token = getTokenValue(token);
      }

      _postArgs.url = unref(unwrapParametersObj.url);

      return _postArgs;
    });

    const xhr = new Xhr<TT>();

    const p = unref(updateArgs.value.params) || {};

    let xhrFunc: typeof xhr.post;

    switch (method) {
      case 'post':
        xhrFunc = xhr.post.bind(xhr);
        break;
      case 'put':
        xhrFunc = xhr.put.bind(xhr);
        break;
      case 'delete':
        xhrFunc = xhr.delete.bind(xhr);
        break;
      default:
        xhrFunc = xhr.post.bind(xhr);
        break;
    }

    return {
      ...useAsync(
        () => xhrFunc({
          ...updateArgs.value,
          params: p,
        }),
      ),
      xhr,
    };
  };

  const post = <TT = T, ZZ extends TypeAllowed = Z, AA extends TypeAllowed[] = A>(
    xhrConfig?: $UpdateConfigArgs,
    params?: RequiredParams<ZZ, AA>,
  ) => update<TT, ZZ, AA>('post', xhrConfig, params);

  const put = <TT = T, ZZ extends TypeAllowed = Z, AA extends TypeAllowed[] = A>(
    xhrConfig?: $UpdateConfigArgs,
    params?: RequiredParams<ZZ, AA>,
  ) => update<TT, ZZ, AA>('put', xhrConfig, params);

  const _delete = <TT = T, ZZ extends TypeAllowed = Z, AA extends TypeAllowed[] = A>(
    xhrConfig?: $UpdateConfigArgs,
    params?: RequiredParams<ZZ, AA>,
  ) => update<TT, ZZ, AA>('delete', xhrConfig, params);

  if (!legacy) {
    onBeforeUnmount(() => {
      xhrList.value.forEach((xhr) => {
        if (xhr.isPending) {
          xhr.abort();
        }
      });
      unwatch.forEach((f) => f());
    });
  }

  return {
    get,
    post,
    put,
    delete: _delete,
  };
}
