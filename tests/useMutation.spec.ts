import useMutation, { useMutationWithError } from '@/useMutation';

describe('GIVEN useMutation', () => {
  describe('WITH single param', () => {
    const func = (a: string) => new Promise<string>((resolve) => {
      resolve(a);
    });

    const {
      mutate,
      onEnd,
    } = useMutation(func);

    describe('WHEN mutate', () => {
      let res: string;
      let onEndParams: string;
      let onEndParamsRes: string;
      beforeAll(async () => {
        onEnd((paramRes, params) => {
          onEndParamsRes = paramRes;
          onEndParams = params;
        });
        res = await mutate('toto');
      });
      it('THEN the result should be `ok`', () => {
        expect(res).toBe('toto');
      });
      it('AND first param of onEnd should be promise resolution', () => {
        expect(onEndParamsRes).toBe(res);
      });
      it('AND the onEnd params should be `string`', () => {
        expect(typeof onEndParams).toBe('string');
        expect(onEndParams).toBe('toto');
      });
    });
  });

  describe('WITH multiple params', () => {
    const func = (a: string, b: string) => new Promise<string>((resolve) => {
      resolve(a + b);
    });
    const {
      mutate,
      onEnd,
    } = useMutation(func);

    describe('WHEN mutate', () => {
      let res: string;
      let onEndParamsRes: string;
      let onEndParams: [string, string];
      beforeAll(async () => {
        onEnd((paramRes, _onEndParams) => {
          onEndParamsRes = paramRes;
          onEndParams = _onEndParams;
        });
        res = await mutate('toto', 'tata');
      });
      it('THEN the result should be `ok`', () => {
        expect(res).toBe('tototata');
      });
      it('AND first param of onEnd should be promise resolution', () => {
        expect(onEndParamsRes).toBe(res);
      });
      it('AND the onEnd params should be [string, string]', () => {
        expect(Array.isArray(onEndParams)).toBe(true);
        expect(onEndParams.length).toBe(2);
        expect(onEndParams[0]).toBe('toto');
        expect(onEndParams[1]).toBe('tata');
      });
    });
  });

  describe('WITH error type', () => {
    const func = (a: string) => new Promise<string>((resolve, reject) => {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject({ message2: 'fakeError' });
    });

    const useMutation = useMutationWithError<{ message2: string }>();

    const {
      mutate,
      error,
    } = useMutation(func);

    describe('WHEN mutate', () => {
      beforeAll(async () => {
        try {
          await mutate('toto');
        } catch (e) {
          // expected error
        }
      });
      it('THEN the error should have compiled type', () => {
        expect(error.value?.message2).toBe('fakeError');
      });
    });
  });
});
