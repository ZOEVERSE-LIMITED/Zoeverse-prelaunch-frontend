import test from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnPath, capturePatientJourney, bindPatientJourney, patientReturnUrl } from '../src/lib/patientJourney.js';
const memory = () => {
  const data = new Map();
  return { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
};
test('return paths reject open redirects and encoded path tricks', () => {
  for (const path of ['//evil.example', 'https://evil.example', '/facility/1?next=evil', '/facility/../1', '/facility/%31', '/facility/0', '/facility/1\\evil']) assert.equal(safeReturnPath(path), null);
  assert.equal(safeReturnPath('/facility/42'), '/facility/42');
});
test('a matching explicitly selected review UUID can return to its originating numeric profile', () => {
  const storage = memory();
  capturePatientJourney('?q=CARE+CLINIC&returnTo=%2Ffacility%2F42', storage, 1000);
  assert.equal(patientReturnUrl(storage, 1001), 'https://zoeverse.ng/search');
  bindPatientJourney({ id: 'review-uuid', name: ' Care   Clinic ' }, storage, 1002);
  assert.equal(patientReturnUrl(storage, 1003), 'https://zoeverse.ng/facility/42');
});
test('choosing a different facility drops an unrelated profile return', () => {
  const storage = memory();
  capturePatientJourney('?q=Clinic+A&returnTo=/facility/42', storage, 1000);
  bindPatientJourney({ id: 'another-uuid', name: 'Clinic B' }, storage, 1001);
  assert.equal(patientReturnUrl(storage, 1002), 'https://zoeverse.ng/search');
});
test('expired, tampered, corrupt and unavailable storage safely fall back to finding care', () => {
  const storage = memory();
  capturePatientJourney('?q=Clinic&returnTo=/facility/42', storage, 1000);
  bindPatientJourney({ id: 'uuid', name: 'Clinic' }, storage, 1001);
  assert.equal(patientReturnUrl(storage, 1000 + 7200001), 'https://zoeverse.ng/search');
  assert.equal(patientReturnUrl(storage, 999), 'https://zoeverse.ng/search');
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.doesNotThrow(() => capturePatientJourney('?q=Clinic&returnTo=/facility/42', blocked));
  assert.equal(patientReturnUrl(blocked), 'https://zoeverse.ng/search');
});
test('starting a fresh review search clears previous navigation context', () => {
  const storage = memory();
  capturePatientJourney('?q=Clinic&returnTo=/facility/42', storage, 1000);
  bindPatientJourney({ id: 'uuid', name: 'Clinic' }, storage, 1001);
  capturePatientJourney('', storage, 1002);
  assert.equal(patientReturnUrl(storage, 1003), 'https://zoeverse.ng/search');
});
test('identically named facilities in different LGAs do not inherit each other’s return', () => {
  const storage = memory();
  capturePatientJourney('?q=Clinic&returnTo=/facility/42&returnArea=Mushin', storage, 1000);
  bindPatientJourney({ id: 'uuid-other-location', name: 'Clinic', lga: 'Ikeja' }, storage, 1001);
  assert.equal(patientReturnUrl(storage, 1002), 'https://zoeverse.ng/search');
  capturePatientJourney('?q=Clinic&returnTo=/facility/42&returnArea=Mushin', storage, 1003);
  bindPatientJourney({ id: 'uuid-right-location', name: 'Clinic', lga: 'Mushin' }, storage, 1004);
  assert.equal(patientReturnUrl(storage, 1005), 'https://zoeverse.ng/facility/42');
});
