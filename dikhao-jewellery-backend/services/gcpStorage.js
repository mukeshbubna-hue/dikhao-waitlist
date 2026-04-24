const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');

const storage = process.env.GCP_SERVICE_ACCOUNT_JSON
  ? new Storage({ credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON) })
  : new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });

const BUCKET = process.env.GCS_STAGING_BUCKET || 'dikhao-vertex-staging';

async function uploadToGCS(imageBuffer, mimeType = 'image/jpeg') {
  const filename = `temp/${uuidv4()}.jpg`;
  const file = storage.bucket(BUCKET).file(filename);
  await file.save(imageBuffer, { contentType: mimeType });
  return `gs://${BUCKET}/${filename}`;
}

async function deleteFromGCS(gcsUri) {
  const filename = gcsUri.replace(`gs://${BUCKET}/`, '');
  await storage.bucket(BUCKET).file(filename).delete().catch(() => {});
}

module.exports = { uploadToGCS, deleteFromGCS };
