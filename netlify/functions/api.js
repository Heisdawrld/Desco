/**
 * Netlify Function: API Handler
 * Wraps the Express app with serverless-http
 */
const serverless = require('serverless-http');
const { app, initDb } = require('../../api/app');

let initialized = false;

const handler = serverless(app, {
  request: async (req) => {
    if (!initialized) {
      await initDb();
      initialized = true;
    }
  }
});

exports.handler = async (event, context) => {
  return handler(event, context);
};
