const { GoogleAuth } = require('google-auth-library');

// Production (Railway): GCP_SERVICE_ACCOUNT_JSON env var holds the key JSON as a string
// Local dev: GOOGLE_APPLICATION_CREDENTIALS points to a file path
function createAuth() {
  const scopes = ['https://www.googleapis.com/auth/cloud-platform'];
  if (process.env.GCP_SERVICE_ACCOUNT_JSON) {
    return new GoogleAuth({
      credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON),
      scopes,
    });
  }
  return new GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes,
  });
}

const auth = createAuth();

async function getAccessToken() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

module.exports = { getAccessToken };
