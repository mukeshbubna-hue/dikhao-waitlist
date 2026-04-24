import api from './client';

// Returns { isHuman: boolean, reason: string }.
// Fails-open on backend errors — caller should treat a caught exception
// as "could not verify, allow through".
export function verifyPersonPhoto(file) {
  const form = new FormData();
  form.append('photoFile', file);
  return api.post('/api/photo/verify-person', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
