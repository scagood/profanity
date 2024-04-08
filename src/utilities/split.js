/**
 * @param {RegExp} regex
 * @param {string} input
 * @returns {{ raw: string, replacers?: string[], match: boolean }[]}
 */
export function verboseSplit(regex, input) {
  const matcher = new RegExp(
    regex.source,
    regex.flags.replace('g', '') + 'g'
  );

  const output = [];

  let match;
  let finalIndex = matcher.lastIndex;
  do {
    const { lastIndex } = matcher;
    match = matcher.exec(input)
    if (match == null) {
      break;
    }

    finalIndex = matcher.lastIndex;
    const prefix = input.slice(lastIndex, match.index);
    if (prefix !== '') {
      output.push({ raw: prefix, match: false });
    }

    output.push({ raw: match[0], replacers: match.slice(1), match: true });
  } while (match)

  if (finalIndex !== input.length)
    output.push(
      { raw: input.slice(finalIndex), match: false },
    );
  return output
}
