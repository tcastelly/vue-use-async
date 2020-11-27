import {
  computed, ComputedRef, isRef, onBeforeUnmount, ref, Ref, watch,
} from '@vue/composition-api';
import {
  CacheDuration, GetConfig, GetReturn, Obj, XhrConfig, XhrGet,
} from './index';
import Xhr from './Xhr';
import cache, { clearCache } from './cache';
import useAsync from './useAsync';

// used as default `onError`
function _blank(e: Error) { // eslint-disable-line @typescript-eslint/no-unused-vars
}

type Token = Ref<string | null> | ComputedRef<string | null> | string | null

type UseXhr<T = any> = {
  onError?: (cb: (e: Error, xhr: Xhr<T>) => any) => any,
  onStart?: (cb: (xhr: Xhr<T>) => any) => any,
  onEnd?: (cb: (xhr: Xhr<T>) => any) => any,
  onProgress?: (cb: (e: ProgressEvent, xhr: Xhr<T>) => any) => any,
  onAbort?: (cb: (e: ProgressEvent, xhr: Xhr<T>) => any) => any;
  context?: any,
  legacy?: boolean,
  token?: Token,
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
    token,
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
    enabled?: Ref<boolean> | boolean,
  ): GetReturn<T> {
    const xhr: Xhr<any> = new Xhr<any>();

    const _onError = (onError || _blank).bind(context);
    const _onStart = (onStart || _blank).bind(context);
    const _onEnd = (onEnd || _blank).bind(context);

    const onErrorList = [_onError];
    const onStartList = [_onStart];
    const onEndList = [_onEnd];

    const error = ref<Error | Obj | null>();

    xhrList.value.push(xhr);

    const isPending = ref<boolean>();

    const data = ref<T>();

    let url = '';
    let duration: CacheDuration = 0;

    const getParams = computed(() => {
      let _getParams: GetConfig = {};

      if (typeof parametersObj === 'string') {
        url = parametersObj;
        _getParams.url = url;
        _getParams.params = {};
      } else if (parametersObj && typeof parametersObj === 'object') {
        ({ url } = parametersObj);

        // use params from second args of get function
        if (!params) {
          params = parametersObj.params || {};
        }

        duration = parametersObj.cacheDuration;

        _getParams = {
          ..._getParams,
          ...parametersObj,
        };
      }

      if (token) {
        _getParams.token = getTokenValue(args.token);
      }

      // merge params
      if (params && typeof _getParams === 'object' && _getParams.params) {
        _getParams.params = {
          ...(isRef(_getParams.params) ? _getParams.params.value : _getParams.params),
          ...(isRef(params) ? (params.value || {}) : params),
        };
      }

      return _getParams;
    });

    let exec = ref(false);
    const _exec = getParams.value?.enabled || enabled;
    if (isRef(_exec)) {
      exec = _exec;
    } else {
      exec = ref(_exec === undefined ? true : _exec);
    }

    let lastCacheId;

    const xhrPromise = ref<XhrGet<T>>();

    const reload = () => {
      if (isPending.value) {
        xhr.abort();
      }

      onStartList.forEach((cb) => cb(xhr));

      isPending.value = true;
      error.value = null;

      if (lastCacheId) {
        clearCache(lastCacheId);
      }

      lastCacheId = decodeURIComponent(Xhr.stringifyUrl(
        url,
        typeof getParams.value.params === 'object' ? getParams.value.params : {},
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
        onEndList.forEach((cb) => cb(xhr));
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
        // we don't want to abort the previous query
        if (!isPending.value && v) {
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
        return xhrPromise.value.abortXhr();
      },
      promise: computed(() => xhrPromise.value),
      reload,
      xhr,
    };
  }

  const post = <T = any>(xhrConfig?: XhrConfig, params: Obj | Ref<Obj> = {}) => {
    const xhr = new Xhr<T>();

    return {
      ...useAsync<T>(
        () => xhr.post(xhrConfig),
        mergeParamsWithToken(params),
      ),
      xhr,
    };
  };

  const put = <T = any>(xhrConfig?: XhrConfig, params?: Obj | Ref<Obj>) => {
    const xhr = new Xhr<T>();

    return {
      ...useAsync<T>(
        () => xhr.put(xhrConfig),
        mergeParamsWithToken(params),
      ),
      xhr,
    };
  };

  const _delete = <T = any>(xhrConfig?: XhrConfig, params?: Obj | Ref<Obj>) => {
    const xhr = new Xhr<T>();

    return {
      ...useAsync<T>(
        () => xhr.delete(xhrConfig),
        mergeParamsWithToken(params),
      ),
      xhr,
    };
  };

  if (!legacy) {
    onBeforeUnmount(() => {
      xhrList.value.forEach((xhr) => xhr.abort());
    });
  }

  return {
    get,
    post,
    put,
    delete: _delete,
  };
}
