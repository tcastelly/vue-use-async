export default class Deferred<T> {
  resolve: (value: (T | PromiseLike<T>)) => void;

  reject: (e: any) => void;

  promise: Promise<T>;

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
      console.warn(e);
    }) */
  }
}
