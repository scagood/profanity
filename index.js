import { checkSwears, matchers } from './src/custom/swears.js';
import { checkNoSwears } from './src/custom/no-swears.js';
import { checkAcronyms } from './src/custom/acronyms.js';

import http from 'http-errors'
import express from 'express';

/**
 * @typedef {Object} ToxicResult
 * @property {{Name?: string, Score?: number}[]} [Labels]
 * @property {number} [Toxicity]
 */


const app = express();

app.set('json spaces', 2)


app.get('/swears', async (request, response) => {
  const output = [];
  for (const match of matchers) {
    output.push(
      `<a href="https://piebridge.me/regulex/#!flags=${match[1].flags}&re=${encodeURIComponent(match[1].source)}" target="_blank">${match[0]}</a>`
    )
  }

  response.send(output.join('<br>'))
});
app.get('/toxic', async (request, response) => {
  try {
    let query = request.query.s;
    if (typeof query !== 'string') {
      throw new http.BadRequest('Invalid query');
    }

    // A little bit of allowed auto cleaning
    query = query.replace(/[\t ]+/, ' ').trim();
    if (query.length > 500) {
      throw new http.BadRequest('Query too long');
    }

    if (/[^ -~]+/.test(query)) {
      throw new http.BadRequest('Only space and visible ASCII characters allowed');
    }

    const swears = checkSwears(query);
    const dirty = checkNoSwears(query);
    const acronyms = checkAcronyms(query);

    response.json({
      "not-known-good": dirty,
      "possible-swear": swears,
      "possible-acronyms": acronyms,
    })
  } catch (err) {
    const error = /** @type {import('http-errors').HttpError} */ (err);

    const status = error.status ?? 500;
    const message = error.message ?? 'Unknown error';
    response.status(status).json({ status, message })
  }
});

app.use(express.static(
  import.meta.dirname + '/public',
  { extensions: [ 'html' ] },
));

const server = app.listen(process.env.PORT ?? 8080)

server.on('listening', () => {
  const address = server.address();

  if (address == null) {
    return console.error('Something is very wrong');
  }

  if (typeof address === 'string') {
    return console.info('Listening to:', address);
  }

  return console.info('Listening on:', `${address.address}:${address.port}`);
})
