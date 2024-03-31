import { ComprehendClient, DetectToxicContentCommand } from "@aws-sdk/client-comprehend";
import { cacher } from './cacher.js';

const client = new ComprehendClient({ region: process.env.AWS_DEFAULT_REGION });

/**
 * @typedef {Object} ToxicResult
 * @property {{Name?: string, Score?: number}[]} [Labels]
 * @property {number} [Toxicity]
 */

/**
 * @param {string} input
 * @returns {Promise<ToxicResult>}
 */
export async function toxicCheck(input) {
  const command = new DetectToxicContentCommand({
    TextSegments: [
      { Text: input },
    ],
    LanguageCode: "en",
  });

  const response = await client.send(command);
  if (response.ResultList == null) {
    throw new Error('Not results');
  }
  
  return response.ResultList[0]
}

export const toxicCheckComprehend = cacher('comprehend', toxicCheck);
