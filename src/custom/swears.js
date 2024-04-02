import { importWords } from '../import-words.js';
import { verboseSplit } from '../split.js';

const words = await importWords(import.meta.resolve('../../data/english-swears.txt'));

/** @type {Record<string, string[]>} */
const leet = {
  a: [ 'a', '@', '4' ],
  b: [ 'b', '6', '8', '|3', '13', 'l3' ],
  c: [ 'c', '(', 'k', 'q' ],
  d: [ 'd', '|)', '|}' ],
  e: [ 'e', '3', 'i', 'y', '*' ],
  f: [ 'f', 'ph' ],
  g: [ 'g', '6', '9', 'j' ],
  h: [ 'h', '#', '|-|', 'I-I' ],
  i: [ 'i', '1', 'l', '|', '!', 'e', 'y' ],
  j: [ 'j', 'g' ],
  k: [ 'k', '|<', '1<', 'I<', 'c', 'q' ],
  l: [ 'l', '1', 'i', '|', '!' ],
  m: [ 'm' ],
  n: [ 'n' ],
  o: [ 'o', '0', '()', 'u' ],
  p: [ 'p' ],
  q: [ 'q', '9' ],
  r: [ 'r', '¬' ],
  s: [ 's', 'z', '5', '$' ],
  t: [ 't', '7', '+' ],
  u: [ 'u', 'o', 'v', '\\/', '\\//', '\\\\/', '\\\\//' ],
  v: [ 'v', '\\/', '\\//', '\\\\/', '\\\\//' ],
  w: [ 'w' ],
  x: [ 'x', '%' ],
  y: [ 'y', '`/', 'e', 'i' ],
  z: [ 'z', 's', '5', '7_' ],

  0: [ '0' ],
  1: [ '1' ],
  2: [ '2' ],
  3: [ '3' ],
  4: [ '4' ],
  5: [ '5' ],
  6: [ '6' ],
  7: [ '7' ],
  8: [ '8' ],
  9: [ '9' ],
}

/** @type {Array<[ RegExp, string[] ]>} */
const phonetics = [
  [ /(ait|ate)/, [ 'ait', 'ate', '8' ] ],
  [ /(asm)/, [ 'asm', 'asim', 'asum' ] ],
  [ /(ck)/, [ 'ck', 'c', 'k', 'q' ] ],
  [ /(ch)/, [ 'ch', 'k', 'c' ] ],
  [ /(\Bcu)/, [ 'cu', 'c', 'k' ] ],
  [ /((?<!e)er|ur)/, [ 'ar', 'er', 'ur', 'a', 'e', 'r' ] ],
  [ /(f)/, [ 'f', 'ph' ] ],
  [ /(ie)/, [ 'ie', 'i', 'y' ] ],
  [ /(ice)/, [ 'ice', 'ace', 'iss' ] ],
  [ /(icle)/, [ 'icle', 'ical', 'icl' ] ],
  [ /(kn)/, [ 'kn', 'n' ] ],
  [ /(nis)/, [ 'nis', 'nas', 'nus' ] ],
  [ /(ore)/, [ 'ore', 'oar', 'or' ] ],
  [ /(trix)/, [ 'trix', 'tric', 'trik' ] ],
  [ /(uck)/, [ 'ack', 'eck', 'ock', 'uck' ] ],
  [ /(wha)/, [ 'wha', 'wa' ] ],
  [ /(whe)/, [ 'whe', 'we' ] ],
  [ /(who)/, [ 'who', 'ho' ] ],
  [ /(que)/, [ 'que', 'qwe' ] ],
  [ /(qu)/, [ 'qu', 'q', 'kw' ] ],
  [ /(w)/, [ 'w', 'vv' ] ],

  // Allow for missing vowels (bastard => bstrd)
  [ /(?<!^|[a])a(?![a]|$)/, [ 'a?' ] ],
  [ /(?<!^|[e])e(?![e]|$)/, [ 'e?' ] ],
  [ /(?<!^|[i])i(?![i]|$)/, [ 'i?' ] ],
  [ /(?<!^|[co])o(?![o]|$)/, [ 'o?' ] ],
  [ /(?<!^|[cqu])u(?![u]|$)/, [ 'u?' ] ],

  // Prevent 2 letter matches "ti?t" -> "tit", not "tt"
  [ /^([a-z]{2})\?([a-z])$/, [ '$1$2' ] ],

  // Allow for single repeating letters (fanny -> fany)
  [ /([a-z])\1+(?!$)/, [ '$1' ] ],
];

/**
 * @param {string} match
 * @returns {string}
 */
function letterToRegexGroup(match) {
  const [ letter, optional ] = match;
  if (Object.hasOwn(leet, letter) === false) {
    throw new Error(`Letter not found: ${letter}`);
  }

  const groupInner = leet[letter]
    .map(string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')

  if (optional === '?') {
    return `(?:${groupInner})*`;
  }

  return `(?:${groupInner})+`;
}

/**
 * @param {string} word
 * @returns {RegExp}
 */
function wordLeetRegex(word) {
  let puddle = [ word ];
  for (const [ match, alternatives ] of phonetics) {
    const nextPuddle = [];
    for (const current of puddle) {
      const parts = verboseSplit(match, current);

      if (parts.every(part => part.match === false)) {
        nextPuddle.push(current);
        continue;
      }

      const splash = Array(alternatives.length)
      for (const part of parts) {
        if (part.match === true) {
          for (const index in alternatives) {
            splash[index] ??= []
            const value = alternatives[index]
              .replace(/\$(&|\d+)/g, (match, target) => {
                if (target === '&') {
                  return part.raw;
                }

                return part.replacers?.[target - 1] ?? match;
              });

            splash[index].push(value);
          }
        } else {
          for (const index in alternatives) {
            splash[index] ??= []
            splash[index].push(part.raw);
          }
        }
      }

      nextPuddle.push(...splash.map(parts => parts.join('')))
    }

    puddle = nextPuddle;
  }

  const matchers = puddle.map(word => {
    return word
      .split(/(.\?*)/g)
      .filter(Boolean)
      .map(letterToRegexGroup)
      .join(/[^a-z]*/.source);
  })

  return new RegExp(matchers.join('|'), 'i');
}

/** @type {[string, RegExp][]} */
export const matchers = words.map((word => [word, wordLeetRegex(word)]));;

/**
 * @param {string} input
 * @returns {string[]}
 */
export function checkSwears(input)  {
  const possible = [];

  for (const [word, matcher] of matchers) {
    if (matcher.test(input)) {
      possible.push(word);
    }
  }

  return possible;
}
