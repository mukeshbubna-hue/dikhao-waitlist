const supabase = require('./supabase');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

async function fetchImage(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  return Buffer.from(res.data);
}

async function uploadToPermanent(buffer, storeId, mimeType = 'image/jpeg') {
  const path = `${storeId}/${uuidv4()}.jpg`;
  const { error } = await supabase.storage.from('permanent').upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('permanent').getPublicUrl(path);
  return data.publicUrl;
}

async function uploadToTemp(buffer, storeId, mimeType = 'image/jpeg') {
  // Cloth photos — temporary, persist for the session but cleaned up regularly.
  // Stored in 'permanent' bucket under a 'temp/' prefix for simplicity.
  const path = `${storeId}/temp/${uuidv4()}.jpg`;
  const { error } = await supabase.storage.from('permanent').upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('permanent').getPublicUrl(path);
  return data.publicUrl;
}

async function uploadToResults(buffer, sessionId, mimeType = 'image/jpeg') {
  const path = `${sessionId}.jpg`;
  const { error } = await supabase.storage.from('results').upload(path, buffer, {
    contentType: mimeType,
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('results').getPublicUrl(path);
  return data.publicUrl;
}

async function deleteFromResults(resultUrl) {
  const path = resultUrl.split('/results/')[1];
  if (!path) return;
  await supabase.storage.from('results').remove([path]);
}

module.exports = { fetchImage, uploadToPermanent, uploadToTemp, uploadToResults, deleteFromResults };
