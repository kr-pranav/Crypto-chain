const cryptoHash = require('./crypto-hash');

describe('cryptoHash()', () => {
  it('generates a SHA-256 hashed output', () => {
    expect(cryptoHash('pranav'))
      .toEqual('ff6fec95b8dd4c95f2fb4731554997f732f4bb9f393190a917b5f1e95eb0f227');
  });
  //`hash` should be generated for "pranav" (with double quotes), since we have used JSON.stringify to the input.

  it('produces the same hash with the same input arguments in any order', () => {
    expect(cryptoHash('one', 'two', 'three'))
      .toEqual(cryptoHash('three', 'one', 'two'));
  });

  //JSON.stringify is used to handle this case, where object reference is same but underlying object has changed its property.
  it('produces a unique hash when the properties have changed on an input', () => {
    const x = {};
    const originalHash = cryptoHash(x);
    x['a'] = 'a';

    expect(cryptoHash(x)).not.toEqual(originalHash);
  });
});