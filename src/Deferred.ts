export default class Deferred<T> {
  resolve: (value: (T | PromiseLike<T>)) => unknown;

  reject: (e: any) => unknown;

  promise: Promise<T>;

  done = false;

  constructor() {
    this.resolve = () => {
      throw Error('Can t resolve');
    };

    this.reject = () => {
      throw Error('Can t reject');
    };

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });/* .catch((e) => {
      // fix unhandled-rejections
      // but success is called ...
      console.warn(e);
    }) */

    this.promise.finally(() => {
      this.done = true;
    });
  }
}
