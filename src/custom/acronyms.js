import { checkSwears } from './swears.js';

const replacer = /\b([a-z0-9])[a-z0-9]*[^a-z0-9]*/gi;

/**
 * @param {string} input
 * @returns {string[]}
 */
export function checkAcronyms(input)  {
  const acronym = input.replace(replacer, '$1');

  return checkSwears(acronym)
}
