import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeDeckTag } from '../src/deck-name';

test('decodes double hyphens as spaces', () => {
  assert.equal(
    decodeDeckTag('Books/Causal--Inference--in--Statistics'),
    'Books::Causal Inference in Statistics'
  );
});

test('preserves nested deck hierarchy', () => {
  assert.equal(
    decodeDeckTag('Books/Statistics/Causal--Inference'),
    'Books::Statistics::Causal Inference'
  );
});

test('preserves single hyphens and underscores', () => {
  assert.equal(
    decodeDeckTag('Books/Pre-Post--snake_case'),
    'Books::Pre-Post snake_case'
  );
});

test('preserves existing deck tags without double hyphens', () => {
  assert.equal(
    decodeDeckTag('My-Existing_Deck/Subdeck'),
    'My-Existing_Deck::Subdeck'
  );
});
