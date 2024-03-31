import { inspect } from 'node:util';
import nlp from 'compromise/two';

import { importWords } from '../import-words.js';

inspect.defaultOptions.depth = null

const words = new Set(await importWords(
  import.meta.resolve('../../data/english-no-swears.txt'),
));

/**
 * @param {string} string
 * @returns {string}
 */
function expand(input) {
  let count = 5;
  
  while (count-- > 0) {
    const output = nlp(input).contractions().expand().all().text();
    if (output === input) {
      return output;
    }

    input = output;
  }
  
  throw new Error('I mean, we\'re here, and I don\'t know how');
}


/**
 * @param {string} input
 * @returns {string[]}
 */
export function checkNoSwears(input)  {
  // it's -> it is, gonna -> going to, etc
  const expanded = expand(input);
  const unknown = [];
  
  for (const term of nlp(expanded).termList()) {
    if (words.has(term.text.toLowerCase())) {
      continue;
    }

    unknown.push(term.text);
  }

  return unknown;
}
