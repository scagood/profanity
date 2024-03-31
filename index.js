import { checkSwears } from './src/custom/swears.js';
import { checkNoSwears } from './src/custom/no-swears.js';

import http from 'http-errors'
import express from 'express';

/**
 * @typedef {Object} ToxicResult
 * @property {{Name?: string, Score?: number}[]} [Labels]
 * @property {number} [Toxicity]
 */


const app = express();

app.set('json spaces', 2)


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
    
    response.json({
      count: swears.length,
      possibleDirty: dirty,
      possibleMatches: swears,
    })
  } catch (error) {
    response.status(error.status??500).json({
      status: error.status ?? 500,
      message: error.message,
    })
  }
});

app.use(express.static(import.meta.dirname + '/public'))

app.listen(8080)

// console.info(await toxicCheck("Fuck you"));
// console.info(await toxicCheck("Ffffffuuuuuuuccccckkkkk uuuuu!"));
// console.info(await toxicCheck("Fuck you very much."));
// console.info(await toxicCheck("If I try to hide a fuck you in amongst other things, will it notice?"));
