import { AST, parseRegExpLiteral } from '@eslint-community/regexpp';

/**
 * @typedef Options
 * @property {number} [maxQuantifier]
 */

/**
 * @param {unknown} element
 * @param {number} index
 * @param {unknown[]} array
 * @returns {boolean}
 */
function unique(element, index, array) {
  return array.indexOf(element) === index;
}

/**
 * @param {string[]} previous
 * @param {string[]} current
 * @returns {string[]}
 */
function merger(previous, current) {
  if (previous.length === 0) {
    return current;
  }

  if (current.length === 0) {
    return previous;
  }

  const output = [];

  for (const one of previous) {
    for (const two of current) {
      output.push(`${one}${two}`);
    }
  }

  return output;
}

const refs = new WeakMap();

/**
 * @param {AST.Pattern | AST.Group | AST.CapturingGroup} element
 * @param {Options} options
 * @returns {string[]}
 */
function expandAlternatives(element, options) {
  const output = new Set();

  for (const alternative of element.alternatives) {
    for (const out of expandAlternative(alternative, options)) {
      output.add(out);
    }
  }

  if (element.type === 'CapturingGroup') {
    refs.set(element, output);
  }

  return [ ...output ];
}

/**
 * @param {AST.Assertion} assertion
 * @returns {string[]}
 */
function expandAssertion(assertion) {
  // @ts-expect-error -- This is only sometimes available
  if (assertion.negate === true) {
    throw new Error('cannot expand Assertion.negated == true');
  }

  switch (assertion.kind) {
    case 'word':
    case 'start':
    case 'end':
      return [''];
  }

  throw new Error(`Cannot expand "CharacterSet.${assertion.kind}"`)
}

/**
 * @param {AST.Backreference} backreference
 * @returns {string[]}
 */
function expandBackreference(backreference) {
  const output = refs.get(backreference.resolved);

  if (output == null) {
    throw new Error(`Cannot resolve backreference (${backreference.start}:${backreference.end})`);
  }

  return [...output];
}

/**
 * @param {AST.Character} character
 * @returns {string[]}
 */
function expandCharacter(character) {
  return [ String.fromCharCode(character.value) ];
}

/**
 * @param {string|number} min
 * @param {string|number} max
 * @returns {string[]}
 */
function expandBetween(min, max) {
  if (typeof min === 'string') {
    min = min.charCodeAt(0);
  }
  if (typeof max === 'string') {
    max = max.charCodeAt(0);
  }

  const output = []
  for (let i = min; i <= max; i++) {
    output.push(String.fromCharCode(i))
  }

  return output;
}

const digit = expandBetween('0','9');
const ll = expandBetween('a','z');
const ul = expandBetween('A','Z');

const word = digit.concat(ll, ul, '_');
const space = [ ' ', '\t', '\r', '\n' ];

/**
 * @param {AST.CharacterSet} characterSet
 * @returns {string[]}
 */
function expandCharacterSet(characterSet) {
  // @ts-expect-error -- This is only sometimes available
  if (characterSet.negate === true) {
    throw new Error('cannot expand CharacterSet.negated == true');
  }

  switch (characterSet.kind) {
    case 'digit': return digit;
    case 'word': return word;
    case 'space': return space;
  }

  throw new Error(`Cannot expand "CharacterSet.${characterSet.kind}"`);
}

const ascii = Array(127).fill(0).map((_, i) => String.fromCharCode(i));
/**
 * @param {AST.CharacterClass} characterClass
 * @returns {string[]}
 */
function extractCharacterClass(characterClass) {
  return characterClass.elements
    .flatMap(element => {
      switch (element.type) {
        case 'Character': return element.raw;
        case 'CharacterClassRange': return expandBetween(
          element.min.value,
          element.max.value
        );
        case 'CharacterSet': return expandCharacterSet(element);
      }

      console.error(element);
      throw new Error(`Cannot expand "${element.type}"`);
    })
    .filter(unique);
}

/**
 * @param {AST.CharacterClass} characterClass
 * @returns {string[]}
 */
function expandCharacterClass(characterClass) {
  const chars = extractCharacterClass(characterClass);

  if (characterClass.negate) {
    const set = new Set(chars);
    return ascii.filter(char => set.has(char) === false);
  }

  return chars;
}

/**
 * @param {AST.Element} element
 * @param {Options} options
 * @returns {string[]}
 */
function expandElement(element, options) {
  switch(element.type) {
    case 'Assertion': return expandAssertion(element);
    case 'Backreference': return expandBackreference(element);
    case 'CapturingGroup': return expandAlternatives(element, options);
    case 'Character': return expandCharacter(element);
    case 'CharacterClass': return expandCharacterClass(element);
    case 'CharacterSet': return expandCharacterSet(element);
    case 'Group': return expandAlternatives(element, options);
    case 'Quantifier': return expandQuantifier(element, options);
  }

  throw new Error(`Cannot expand "${element.type}"`);
}

/**
 * @param {AST.Quantifier} quantifier
 * @param {Options} options
 * @returns {string[]}
 */
function expandQuantifier(quantifier, options) {
  const min = Math.max(quantifier.min, 0);

  if (
    quantifier.max === Number.POSITIVE_INFINITY &&
    options.maxQuantifier == null
  ) {
    console.warn('options.maxQuantifier not set, clamping to 10')
  }
  const max = Math.min(quantifier.max, options.maxQuantifier ?? 10);

  const repeats = max - min + 1;
  return expandElement(quantifier.element, options)
    .flatMap(target => Array(repeats)
      .fill(0)
      .map((_, index) => target.repeat(index + min)),
    );
}

/**
 * @param {AST.Alternative} alternative
 * @param {Options} options
 * @returns {string[]}
 */
function expandAlternative(alternative, options) {
  return alternative.elements
    .map(element => expandElement(element, options))
    .reduce(merger, []);
}

/**
 * @param {RegExp} regex
 * @param {Options} [options]
 * @returns {string[]}
 */
export function expandRegex(regex, options = {}) {
  const ast = parseRegExpLiteral(regex);


  // This is to remove invalid back references currently a
  // \1 is replaced with all possible matches of the group
  return expandAlternatives(ast.pattern, options)
    .filter(string => regex.test(string));
}

console.info(expandRegex(/123/));
console.info(expandRegex(/qwe|rty/));
console.info(expandRegex(/(?:qwe|rty)/));
console.info(expandRegex(/(as|df)(as|df)/));
console.info(expandRegex(/(as|df)(as|df)\1/));
console.info(expandRegex(/[aeiou]/));
console.info(expandRegex(/[a-f]/));
console.info(expandRegex(/\a{3,5}\b/));
console.info(expandRegex(/(\r?\n|\r)+/, {maxQuantifier: 3}));
console.info(expandRegex(/[|Il/]3/));
