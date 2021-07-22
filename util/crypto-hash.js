const crypto = require('crypto');           //crypto -> in-built class (no need to specify the path).

const cryptoHash = (...inputs) => {         //(...) -> spread operator. Gives all arguments in an array named 'inputs'.
                                            //to be used when no.of arguments is not known.
  const hash = crypto.createHash('sha256'); 

  hash.update(inputs.map( input => JSON.stringify(input) ).sort().join(' '));   //join -> to join all elements of inputs array.
                                                                                //sort() -> to get same order (irrespective of input order)
                                                                                //map() function to stringify each input -> inorder to compare the actual underlying objects instead of just comparing the object references.
  return hash.digest('hex');                //to represent in hexadecimal form
};

module.exports = cryptoHash;