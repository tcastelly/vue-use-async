import type { Obj, XhrConfig, XhrGet } from './index';
import Deferred from './Deferred';

export default class Xhr<T> {
  static parseResult(xhr: XMLHttpRequest): Response {
    let result = xhr.response;
    try {
      const contentType = xhr.getResponseHeader('Content-Type');
      if (contentType && contentType.toLowerCase().indexOf('json') > -1) {
        result = JSON.parse(xhr.response);
      }
    } catch (e) {
      result = xhr.response;
    }
    return result;
  }

  // eslint-disable-next-line class-methods-use-this
  onError: (e: ProgressEvent) => void = () => {
  };

  // eslint-disable-next-line class-methods-use-this
  onStart: (e: ProgressEvent) => void = () => {
  };

  // eslint-disable-next-line class-methods-use-this
  onAbort: (e: ProgressEvent) => void = () => {
  };

  // eslint-disable-next-line class-methods-use-this
  onProgress: (e: ProgressEvent) => void = () => {
  };

  // eslint-disable-next-line class-methods-use-this
  onEnd: (result: any | null, e: ProgressEvent) => void = () => {
  };

  static onBeforeSendList: Array<(params: Obj) => Obj> = [];

  static onBeforeSend(cb: (params: Obj) => Obj) {
    Xhr.onBeforeSendList.push(cb);
  }

  // Bearer token
  token: string | null = null;

  url = '';

  params: Obj = {};

  sendAs: 'multipart' | 'json' = 'json';

  timeout = 10000;

  port = 80;

  responseType: 'arraybuffer' | 'blob' | 'json' | 'text' = 'text';

  isPending = false;

  _eventsReady: boolean;

  // @ts-ignore - declared in _constructor
  _oXHR: XMLHttpRequest;

  // @ts-ignore - declared in _constructor
  _onEnd: (e: ProgressEvent) => void;

  _onError(e: ProgressEvent): void {
    this.onError(e);

    this._deferred.reject(e);
  }

  // @ts-ignore - declared in _constructor
  _deferred: Deferred<T>;

  // @ts-ignore - declared in _constructor
  _isXhrResolved: boolean;

  // @ts-ignore - declared in _constructor
  _isXhrRejected: boolean;

  // @ts-ignore - declared in _constructor
  _eventReady: boolean;

  constructor(xhrParams?: XhrConfig, params?: Obj) {
    // `new` or all public methods can initialize events
    // variable used to avoid multiple same listeners
    this._eventsReady = false;

    this._constructor(xhrParams || {}, params);
  }

  static new<Z>(paramsObj?: XhrConfig): Xhr<Z> {
    return new Xhr<Z>(paramsObj);
  }

  _getUrl(initial: Obj = {}): string {
    const params = Xhr.onBeforeSendList.reduce((acc, v) => v(acc || {}), initial);

    return Xhr.stringifyUrl(this.url, params);
  }

  removeEvents() {
    const removeEvents = () => {
      this._oXHR.removeEventListener('load', this._onEnd, false);
      this._oXHR.removeEventListener('error', this.onError, false);
      this._oXHR.removeEventListener('loadstart', this.onStart, false);
      this._oXHR.removeEventListener('abort', this.onAbort, false);
      this._oXHR.upload.removeEventListener('progress', this.onProgress, false);
      this._oXHR.removeEventListener('progress', this.onProgress, false);
      this._oXHR.removeEventListener('timeout', this.onError, false);
    };

    // remove listener only when the query is ended
    this._deferred.promise.then(removeEvents, removeEvents);
  }

  post(paramsObj: XhrConfig): Promise<T> {
    this._constructor(paramsObj);
    this._oXHR.open('POST', this._getUrl(), true);
    this._send();

    return this._deferred.promise;
  }

  put(paramsObj: XhrConfig): Promise<T> {
    this._constructor(paramsObj);
    this._oXHR.open('PUT', this._getUrl(), true);
    this._send();

    return this._deferred.promise;
  }

  /**
   * Rewrite URL or send query parameters
   * Return a Promise with a function to abort the xhr
   *
   * @returns {Promise}, consolidate the promise with the `abortXhr` function
   */
  get(paramsObj?: XhrConfig): XhrGet<T> {
    this._constructor(paramsObj || {});

    this._oXHR.open(
      'GET',
      this._getUrl(this.sendAs === 'multipart' ? {} : this.params),
      true,
    );
    this._send();

    // add to the promise, way to cancel xhr query
    const _d = this._deferred.promise as Partial<XhrGet<T>>;
    _d.abortXhr = this.abort.bind(this);

    return _d as XhrGet<T>;
  }

  delete(paramsObj: XhrConfig): Promise<any> {
    this._constructor(paramsObj);
    this._oXHR.open('DELETE', this._getUrl(this.params), true);
    this._send();

    return this._deferred.promise;
  }

  /**
   * Abort xhr query and reject promise
   */
  abort(): Promise<T> {
    // don t abort twice
    if (!this._isXhrResolved || this._isXhrRejected) {
      // @ts-ignore
      this._oXHR.abort(null, this); // preserve context for tests
      this._isXhrRejected = true;
      this._deferred.reject({
        error: `Xhr aborted: ${this.url}`,
        code: 'HTTP-ABORTED',
      });
    }

    return this._deferred.promise;
  }

  static stringifyUrl(url: string, params: Obj = {}): string {
    const paramsInjected = Xhr._injectParamsInUrl(url, params);
    ({
      url,
      params,
    } = paramsInjected);

    let separator = url.indexOf('?') > -1 ? '&' : '?';
    let queryParams = '';

    // Stringify get parameters
    Object.keys(params)
      // remove undefined param
      .filter((paramKey) => params[paramKey] !== undefined)
      .forEach((paramKey) => {
        queryParams += `${separator + paramKey}=${encodeURIComponent(JSON.stringify(params[paramKey]))}`;
        separator = '&';
      });

    // remove unresolved query parameters (:value)
    url = url.replace(/\/:[^/]*/gi, '');

    return url + queryParams;
  }

  /**
   * return FormData
   */
  static getFormData(data: Obj): FormData {
    const formData = new FormData();

    let value;
    Object.keys(data).forEach((key) => {
      if (data[key] instanceof FileList) {
        for (let i = 0; i < data[key].length; i += 1) {
          formData.append(key, data[key][i]);
        }
      } else if (data[key] instanceof File) {
        formData.append(key, data[key]);
      } else {
        value = data[key];
        if ((typeof value === 'object' || Array.isArray(value)) && value !== null) {
          value = JSON.stringify(value);
        }
        formData.append(key, value);
      }
    });

    return formData;
  }

  /**
   * Force to resolve deferred
   * @param res
   */
  resolve(res: T): Promise<T> {
    this._deferred.resolve(res);

    return this._deferred.promise;
  }

  /**
   * Force to reject deferred
   * @param res
   */
  reject(res: Error): Promise<any> {
    this._deferred.reject(res);

    return this._deferred.promise;
  }

  /**
   * @param {String} url, url with path params will be replaced by params values
   * @param {Object} params
   *
   * @return {{url: *, params}}
   * @private
   */
  static _injectParamsInUrl(url: string, params: Obj | Array<unknown> = {}): { url: string, params: Obj } {
    if (Array.isArray(params)) {
      return {
        url,
        params,
      };
    }

    const paramsKeys = Object.keys(params);

    // query params already set in the URL
    const existingParams: { [id: string]: any } = {};

    let decodedUrl = decodeURIComponent(url);

    // extract existing query params
    const paramPos = decodedUrl.indexOf('?');
    const trueStr = true.toString();
    const falseStr = false.toString();
    if (paramPos > -1) {
      decodedUrl.split('?')[1].split('&').reduce((acc, v) => {
        const [k, _v] = v.split('=');
        const [, __v] = _v.match(/^(?:"?([^"]+)"?)$/) || [];

        if (__v === trueStr || __v === falseStr) {
          acc[k] = __v === trueStr;
        } else {
          const vNbr = Number(__v);
          acc[k] = __v === '' || Number.isNaN(vNbr) ? __v : vNbr;
        }

        return acc;
      }, existingParams);
      decodedUrl = decodedUrl.substring(0, paramPos);
    }

    //
    // replace path params
    const unbindParams = paramsKeys
      .reduce((acc, v) => {
        acc[v] = params[v];
        return acc;
      }, existingParams);

    // escape hash character
    decodedUrl = decodedUrl.replace(/#/, '%23');

    (decodedUrl.match(/:[a-z0-9]+/gi) || []).forEach((placeholder) => {
      placeholder = placeholder.substring(1);
      if (unbindParams[placeholder] !== undefined) {
        // stringify null
        decodedUrl = decodedUrl.replace(
          `:${placeholder}`,
          (unbindParams[placeholder] === null || unbindParams[placeholder] === '') ? 'null' : unbindParams[placeholder],
        );

        // remove duplicated parameters
        delete unbindParams[placeholder];
      }
    });

    return {
      url: decodedUrl,
      params: unbindParams,
    };
  }

  /**
   * Set events and bind params
   * @param {XMLHttpRequest} xhr
   * @private
   */
  _setEvents(xhr: XMLHttpRequest): void {
    // don t redefine events
    if (this._eventsReady) {
      return;
    }

    this._eventReady = true;

    xhr.addEventListener('load', this._onEnd, false);
    xhr.addEventListener('error', this.onError, false);
    xhr.addEventListener('loadstart', this.onStart, false);
    xhr.addEventListener('abort', this.onAbort, false);
    xhr.upload.addEventListener('progress', this.onProgress, false);
    xhr.addEventListener('progress', this.onProgress, false);
    xhr.addEventListener('timeout', this.onError, false);
  }

  /**
   * Send xhr
   * If params contain files, use multipart, else JSON
   */
  _send(): void {
    let params;

    this.isPending = true;

    if (this.sendAs === 'multipart') {
      params = Xhr.getFormData(this.params);
    } else if (this.sendAs === 'json') {
      this._oXHR.setRequestHeader('content-type', 'application/json; charset=utf-8');
      params = JSON.stringify(this.params);
    }

    if (this.token) {
      this._oXHR.setRequestHeader('Authorization', `Bearer ${this.token}`);
    }

    // @ts-ignore
    this._oXHR.send(params, this); // preserve context for tests
  }

  /**
   * The constructor can be called by the `new` or by each public method
   */
  _constructor(paramsObj: XhrConfig, params?: Obj): void {
    if (paramsObj && typeof paramsObj === 'object') {
      this.sendAs = paramsObj.sendAs || this.sendAs;
      this.url = paramsObj.url || this.url;
      this.port = paramsObj.port || this.port;
      this.params = paramsObj.params || this.params;
      this.timeout = paramsObj.timeout || this.timeout;
      this.responseType = paramsObj.responseType || this.responseType;
      this.onProgress = (paramsObj.onProgress || this.onProgress).bind(this);
      this.onStart = (paramsObj.onStart || this.onStart).bind(this);
      this.onAbort = (paramsObj.onAbort || this.onAbort).bind(this);
      this.onEnd = (paramsObj.onEnd || this.onEnd).bind(this);
      this.onError = (paramsObj.onError || this.onError).bind(this);
      this.token = paramsObj.token || this.token;
    } else if (paramsObj && typeof paramsObj === 'string') {
      this.url = paramsObj;
      this.params = params || this.params;
    }

    if (this.port !== 80) {
      this.url = `${window.location.protocol}//${window.location.hostname}:${this.port}${this.url}`;
    }

    this._deferred = new Deferred();
    this._deferred.promise.finally(() => {
      this.isPending = false;
    });
    this._oXHR = new XMLHttpRequest();
    this._oXHR.timeout = this.timeout;
    this._oXHR.responseType = this.responseType;

    this._isXhrResolved = false;
    this._isXhrRejected = false;

    const injectedParams = Xhr._injectParamsInUrl(this.url, this.params);

    this.url = injectedParams.url;
    this.params = injectedParams.params;

    this._onEnd = (e: ProgressEvent) => {
      const result: any = Xhr.parseResult(this._oXHR);

      if (this._oXHR.status >= 400) {
        this._isXhrRejected = true;
        this._onError(result);
        return this._deferred.reject(result);
      }

      this.onEnd(result, e);
      this._isXhrResolved = true;

      this.removeEvents();

      return this.resolve(result);
    };

    this._setEvents(this._oXHR);
  }
}
