import test from 'node:test';
import assert from 'node:assert/strict';
import { canFinishEarly } from '../src/lib/review/rules.js';

const config = {
  minScoredAnswers: 1,
  screens: [
    { id: 'about_visit', title: 'Your visit', questions: [{ id: 'visitConfirmed', question: 'Was this a real visit?', kind: 'boolean', required: true }] },
    { id: 'experience_one', title: 'Your experience', questions: [{ id: 'care', question: 'How was the care?', kind: 'rating_scale', required: true, scored: true, options: [{ value: 4, label: 'Good' }] }] },
    { id: 'later', title: 'More details', questions: [{ id: 'explanation', question: 'Were things explained?', kind: 'boolean', required: true }] },
  ],
};

test('early finish requires the visit and first experience section, with enough ratings', () => {
  assert.equal(canFinishEarly(config, {}), false);
  assert.equal(canFinishEarly(config, { visitConfirmed: true }), false);
  assert.equal(canFinishEarly(config, { visitConfirmed: true, care: 'NA' }), false);
  assert.equal(canFinishEarly(config, { visitConfirmed: true, care: 4 }), true);
  assert.equal(canFinishEarly(config, { visitConfirmed: false, care: 4 }), false);
  assert.equal(canFinishEarly({ ...config, minScoredAnswers: 2 }, { visitConfirmed: true, care: 4 }), false);
});
