import Deferred from '@/Deferred';

describe('Given Deferred', () => {
  describe('WHEN instance a Deferred and resolve it', () => {
    let _d: Deferred<string>;
    beforeAll(() => {
      _d = new Deferred();
      setTimeout(() => {
        _d.resolve('ok');
      }, 0);
    });
    it('THEN the promise should be resolved', () => expect(_d.promise).resolves.toEqual('ok'));
  });
  describe('WHEN instance a Deferred and reject it', () => {
    let _d: Deferred<string>;
    beforeAll(() => {
      _d = new Deferred();
      setTimeout(() => {
        _d.reject('ko');
      }, 0);
    });
    it('THEN the promise should be rejected', () => expect(_d.promise).rejects.toMatch('ko'));
  });
});
