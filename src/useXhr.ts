import {
  computed,
  ComputedRef,
  isRef,
  onBeforeUnmount,
  ref,
  Ref, unref,
  watch,
} from 'vue';
import {
  CacheDuration,
  GetConfig,
  GetReturn,
  Obj,
  XhrConfig,
  XhrGet,
} from './index';
import Xhr from './Xhr';
import cache, { clearCache } from './cache';
import useAsync from './useAsync';

type Token = Ref<string | null> | ComputedRef<string | null> | string | null

type OnErrorCb <T> = (e: Error, xhr: Xhr<T>) => any

type OnStartCb <T> = (params: any, xhr: Xhr<T>) => any;

type OnEndCb <T> = (res: undefined | T, params: any, xhr: Xhr<T>) => any

// used as default `onError`
const _blank = () => {};

declare type UseXhr<T = any> = {
  // global callback for VueJS 2 plugin compatibility
  onError?: OnErrorCb<T>,
  onStart?: OnStartCb<T>,
  onEnd?: OnEndCb<T>,
  onProgress?: (e: ProgressEvent) => any,
  onAbort?: (e: ProgressEvent) => any,
  //
  context?: any;
  legacy?: boolean;
  token?: Token;
};

const getTokenValue: (token: Token) => string | null = (token) => {
  if (isRef(token)) {
    return token.value;
  }

  const tokenStr: any = token;

  return tokenStr;
};

export default function (args?: UseXhr) {
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

  const mergeParamsWithToken = (params: Obj | Ref<Obj>) => {
    const _token = getTokenValue(token);
    if (!_token) {
      return params;
    }

    if (isRef(params)) {
      params.value.token = _token;
    } else {
      params.token = _token;
    }

    return params;
  };

  const xhrList = ref<Array<Xhr<any>>>([]);

  /**
   * For GET it's possible to add cache
   */
  function get<T>(
    parametersObj: GetConfig,
    params?: Ref<Obj> | Obj,
    enabled?: Ref<boolean> | ComputedRef<boolean> | boolean,
  ): GetReturn<T> {
    const xhr: Xhr<any> = new Xhr<any>();

    // Global cb for VueJS 2 Plugin Compatibility
    const _onError = (onError || _blank as unknown as OnErrorCb<T>).bind(context);
    const _onStart = (onStart || _blank as unknown as OnStartCb<T>).bind(context);
    const _onEnd = (onEnd || _blank as unknown as OnEndCb<T>).bind(context);

    const onErrorList: OnErrorCb<T>[] = [_onError];
    const onStartList: OnStartCb<T>[] = [_onStart];
    const onEndList: OnEndCb<T>[] = [_onEnd];

    const error = ref<Error | Obj | null>();

    xhrList.value.push(xhr);

    const isPending = ref<undefined | boolean>();

    const data = ref<T>();

    let url: undefined | string = '';
    let duration: undefined | CacheDuration = 0;

    const getParams = computed(() => {
      let _getParams: GetConfig = {};

      const unwrapParametersObj = unref(parametersObj);

      if (typeof unwrapParametersObj === 'string') {
        url = unwrapParametersObj;
        _getParams.url = url;
        _getParams.params = {};
      } else {
        const _url = unwrapParametersObj.url;

        url = unref(_url);

        // use params from second args of get function
        if (!params) {
          params = unwrapParametersObj.params || {};
        }

        duration = unwrapParametersObj.cacheDuration;

        _getParams = {
          ..._getParams,
          ...unwrapParametersObj,
        };
      }

      if (token) {
        _getParams.token = getTokenValue(token);
      }

      // merge params
      _getParams.params = {
        ...isRef(_getParams.params) ? _getParams.params.value : _getParams.params,
        ...(isRef(params) ? (params.value || {}) : params),
      };

      return _getParams;
    });

    let exec = ref(false);
    const _exec = getParams.value?.enabled || enabled;
    if (isRef(_exec)) {
      exec = _exec;
    } else {
      exec = ref(_exec === undefined ? true : _exec);
    }

    let lastCacheId: null | string;

    const xhrPromise = ref<XhrGet<T>>();

    const reload = () => {
      if (isPending.value) {
        xhr.abort();
      }

      const xhrParams = typeof getParams.value.params === 'object' ? getParams.value.params : {};

      onStartList.forEach((cb) => cb(xhrParams, xhr));

      isPending.value = true;
      error.value = null;

      if (lastCacheId) {
        clearCache(lastCacheId);
      }

      lastCacheId = decodeURIComponent(Xhr.stringifyUrl(
        String(url),
        xhrParams,
      ));

      // Preserve function extended in promise (abort)
      xhrPromise.value = cache<T>({
        id: lastCacheId,
        xhr: xhr.get.bind(xhr, getParams.value),
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
      }, {
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
      }, {
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

  const post = <T = any>(xhrConfig?: XhrConfig, params: Obj | Ref<Obj> = {}) => {
    const xhr = new Xhr<T>();

    return {
      ...useAsync<T>(
        () => xhr.post(xhrConfig || {}),
        mergeParamsWithToken(params),
      ),
      xhr,
    };
  };

  const put = <T = any>(xhrConfig?: XhrConfig, params?: Obj | Ref<Obj>) => {
    const xhr = new Xhr<T>();

    return {
      ...useAsync<T>(
        () => xhr.put(xhrConfig || {}),
        mergeParamsWithToken(params || {}),
      ),
      xhr,
    };
  };

  const _delete = <T = any>(xhrConfig?: XhrConfig, params?: Obj | Ref<Obj>) => {
    const xhr = new Xhr<T>();

    return {
      ...useAsync<T>(
        () => xhr.delete(xhrConfig || {}),
        mergeParamsWithToken(params || {}),
      ),
      xhr,
    };
  };

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
