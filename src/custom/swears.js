import { importWords } from '../import-words.js';

const words = await importWords(import.meta.resolve('../../data/english-swears.txt'));

/** @type {Record<string, string[]>} */
const leet = {
  a: [ 'a', '@', '4' ],
  b: [ 'b', '8', '|3', '13', 'l3' ],
  c: [ 'c', '(', 'k', 'q' ],
  d: [ 'd', '|)', '|}' ],
  e: [ 'e', '3', 'i', 'y', '*' ],
  f: [ 'f', 'ph' ],
  g: [ 'g', '9', 'j' ],
  h: [ 'h', '#', '|-|', 'I-I' ],
  i: [ 'i', '1', 'l', '|', '!', 'e', 'y' ],
  j: [ 'j', 'g' ],
  k: [ 'k', '|<', '1<', 'I<', 'c', 'q' ],
  l: [ 'l', '1', 'i', '|', '!' ],
  m: [ 'm' ],
  n: [ 'n' ],
  o: [ 'o', '0', '()', 'u' ],
  p: [ 'p' ],
  q: [ 'q', '9', 'c', 'k' ],
  r: [ 'r', '¬' ],
  s: [ 's', 'z', '5', '$' ],
  t: [ 't', '7', '+' ],
  u: [ 'u', 'o', 'v', '\\/', '\\//', '\\\\/', '\\\\//' ],
  v: [ 'v', '\\/', '\\//', '\\\\/', '\\\\//' ],
  w: [ 'w', 'vv' ],
  x: [ 'x', '%' ],
  y: [ 'y', '`/', 'e', 'i' ],
  z: [ 'z', 's', '5', '7_' ],
}

/** @type {Array<[ RegExp, string[] ]>} */
const phonetics = [
  [ /(ait|ate)/, [ 'ait', 'ate' ] ],
  [ /(asm)/, [ 'asm', 'asim', 'asum' ] ],
  [ /(ck)/, [ 'ck', 'c', 'k', 'q' ] ],
  [ /(ch)/, [ 'ch', 'k', 'c' ] ],
  [ /(cu)/, [ 'cu', 'c', 'k' ] ],
  [ /(ar|er|ur)/, [ 'ar', 'er', 'ur', 'a', 'e', 'r' ] ],
  [ /(f)/, [ 'f', 'ph' ] ],
  [ /(gg)/, [ 'gg', 'g' ] ],
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
  [ /(qu)/, [ 'qu', 'q' ] ],
];

/**
 * @param {string} letter
 * @returns {string}
 */
function letterToRegexGroup(letter) {
  if (Object.hasOwn(leet, letter) === false) {
    throw new Error('Letter not found');
  }

  const groupInner = leet[letter]
    .map(string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  
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
      const parts = current
        .split(match)
        .filter(Boolean);
      
      if (parts.length === 1) {
        nextPuddle.push(current);
        continue;
      }

      const splash = Array(alternatives.length)
      for (const part of parts) {
        if (match.test(part)) {
          for (const index in alternatives) {
            splash[index] ??= []
            splash[index].push(alternatives[index]);
          }
        } else {
          for (const index in alternatives) {
            splash[index] ??= []
            splash[index].push(part);
          }
        }
      }
      
      nextPuddle.push(...splash.map(parts => parts.join('')))
    }
    
    puddle = nextPuddle;
  }

  const matchers = puddle.map(word => {
    return word
      .split('')
      .map(letterToRegexGroup)
      .join(/[^a-z]*/.source);
  })
  
  return new RegExp(matchers.join('|'), 'i');
}

/** @type {[string, RegExp][]} */
const matchers = words.map((word => [word, wordLeetRegex(word)]));;

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
