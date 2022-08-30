import {
  computed, ComputedRef, isRef, onBeforeUnmount, ref, Ref, unref, watch,
} from 'vue';
import type {
  $GetConfigArgs,
  $UpdateConfigArgs,
  CacheDuration,
  GetConfig,
  GetReturn,
  Obj,
  TypeAllowed,
  XhrConfig,
  XhrGet,
} from './index';
import Xhr from './Xhr';
import cache, { clearCache } from './cache';
import useAsync from './useAsync';

type Enabled = undefined | null | (() => boolean) | Ref<boolean> | ComputedRef<boolean> | boolean;

type Token = Ref<string | null> | ComputedRef<string | null> | string | null

type OnErrorCb<T> = (e: Error, xhr: Xhr<T>) => unknown

type OnStartCb<T, Z> = (params: Z, xhr: Xhr<T>) => unknown

type OnEndCb<T, Z> = (res: T, params: Z, xhr: Xhr<T>) => unknown

// override url to have string used by Xhr
type $$GetConfigArg<T> = Omit<$GetConfigArgs<T>, 'url'> & {
  url?: string,
}

type Params<Z> = (() => Z) |
  ComputedRef<Z> |
  Ref<Z> |
  Z

// used as default `onError`
const _blank = () => {
};

declare type UseXhr<T, Z extends TypeAllowed> = Partial<{
  // global callback for VueJS 2 plugin compatibility
  onError: OnErrorCb<T>,
  onStart: OnStartCb<T, Params<Z>>,
  onEnd: OnEndCb<T, Params<Z>>,
  onProgress: (e: ProgressEvent) => any,
  onAbort: (e: ProgressEvent) => any,
  //
  context: any;
  legacy: boolean;
  token: Token;
}>;

const getTokenValue = (token: undefined | Token): undefined | null | string => unref<undefined | string | null>(token);

export default function <T, Z extends TypeAllowed>(args?: UseXhr<T, Z>) {
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

  /**
   * For GET it's possible to add cache
   */
  function get<TT = T, ZZ = Z>(
    parametersObj: GetConfig<ZZ>,
    params?: Params<ZZ>,
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

    const data = ref() as Ref<TT>;

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
          params = (unwrapParametersObj.params || {}) as Params<ZZ>;
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
      let p = unref(_getParams.params || params || {} as Params<ZZ>);
      if (typeof p === 'function') {
        p = (p as () => ZZ)();
      }

      _getParams.params = {
        ...p as ZZ,
        ...(isRef(params) ? (params.value || {}) : params),
      };

      url = typeof _url === 'function' ? _url(_getParams.params) : unref(_url);
      _getParams.url = url;

      return _getParams;
    });

    let exec: Ref<boolean>;
    const _exec: Enabled = getParams.value.enabled !== undefined ? getParams.value.enabled : enabled;
    if (_exec === undefined) {
      exec = ref(true);
    } else if (isRef(_exec)) {
      exec = _exec;
    } else if (typeof _exec === 'function') {
      exec = ref(_exec());
    } else {
      exec = ref(_exec === true);
    }

    let lastCacheId: null | string;

    const xhrPromise = ref<XhrGet<TT>>();

    const reload = () => {
      if (isPending.value) {
        xhr.abort();
      }

      const xhrParams = typeof getParams.value.params === 'object' ? getParams.value.params : {} as ZZ;

      onStartList.forEach((cb) => cb(xhrParams, xhr));

      isPending.value = true;
      error.value = null;

      if (lastCacheId) {
        clearCache(lastCacheId);
      }

      lastCacheId = decodeURIComponent(Xhr.stringifyUrl(
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

      xhrPromise.value.then((_data) => {
        data.value = _data;
      }, (err) => {
        onErrorList.forEach((cb) => cb(err, xhr));
        error.value = err;
      });
      xhrPromise.value.finally(() => {
        removeHttpXhrList();
        isPending.value = false;
        onEndList.forEach((cb) => cb(data.value, xhrParams, xhr));
      });
    };

    // reload if parameters changed
    watch(
      () => getParams.value,
      () => {
        if (exec.value) {
          reload();
        }
      },
      {
        immediate: exec.value,
      },
    );

    // reload if the query has been enabled
    watch(
      () => exec.value,
      (v) => {
        // we don't want to execute twice if params changed AND exec changed
        if (!isPending.value && v) {
          // we don't want to abort the previous query
          reload();
        }
      },
      {
        // avoid simultaneously query
        immediate: false,
      },
    );

    return {
      isPending: computed(() => isPending.value),
      data,
      onError: (cb) => onErrorList.push(cb),
      onStart: (cb) => onStartList.push(cb),
      onEnd: (cb) => onEndList.push(cb),
      error,
      abort() {
        return xhrPromise.value?.abortXhr();
      },
      promise: computed(() => xhrPromise.value || new Promise(() => {
      })),
      reload,
      xhr,
    };
  }

  const update = <TT = T, ZZ = Z>(method: 'post' | 'delete' | 'put', xhrConfig?: $UpdateConfigArgs, params?: Params<ZZ>) => {
    const updateArgs = computed(() => {
      const _postArgs: $UpdateConfigArgs<ZZ> = {};

      const unwrapParametersObj = unref(xhrConfig || {} as XhrConfig);

      // use params from second args of post function
      if (!params) {
        params = (unwrapParametersObj.params || {}) as Params<ZZ>;
      }
      _postArgs.params = unref<ZZ>(params as ZZ);

      if (token) {
        _postArgs.token = getTokenValue(token);
      }

      // merge params
      let p = unref(_postArgs.params || params || {} as Params<ZZ>);
      if (typeof p === 'function') {
        p = (p as () => ZZ)();
      }

      _postArgs.params = {
        ...p as ZZ,
        ...(isRef(params) ? (params.value || {}) : params),
      };

      _postArgs.url = unref(unwrapParametersObj.url);

      return _postArgs;
    });

    const xhr = new Xhr<TT>();

    const p = (unref(updateArgs.value.params) || {}) as object;

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

  const post = <TT = T, ZZ = Z>(xhrConfig?: $UpdateConfigArgs, params?: Params<ZZ>) => update<TT, ZZ>('post', xhrConfig, params);

  const put = <TT = T, ZZ = Z>(xhrConfig?: $UpdateConfigArgs, params?: Params<ZZ>) => update<TT, ZZ>('put', xhrConfig, params);

  const _delete = <TT = T, ZZ = Z>(xhrConfig?: $UpdateConfigArgs, params?: Params<ZZ>) => update<TT, ZZ>('delete', xhrConfig, params);

  if (!legacy) {
    onBeforeUnmount(() => {
      xhrList.value.forEach((xhr) => {
        if (xhr.isPending) {
          xhr.abort();
        }
      });
    });
  }

  return {
    get,
    post,
    put,
    delete: _delete,
  };
}
