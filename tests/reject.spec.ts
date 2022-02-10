describe('WHEN reject a promise', () => {
  it('THEN the promise should be rejected with `octopus` error', () => {
    const fetch = (): Promise<unknown> => new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(Error('octopus'));
      }, 200);
    });
    return expect(fetch).rejects.toThrow('octopus');
  });
});
