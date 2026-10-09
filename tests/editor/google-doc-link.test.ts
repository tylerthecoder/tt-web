import { describe, expect, test } from 'bun:test';
import { parseGoogleDocId } from '../../app/components/google-doc-link';

const id = '1Example_google-DocumentId123456789';

describe('Google Doc links', () => {
  for (const value of [
    id,
    `  ${id}\n`,
    `https://docs.google.com/document/d/${id}`,
    `https://docs.google.com/document/d/${id}/edit`,
    `https://docs.google.com/document/d/${id}?usp=sharing#heading=h.example`,
    `https://docs.google.com/document/d/${id}/edit?tab=t.0#heading=h.example`,
    `https://docs.google.com/document/u/0/d/${id}/edit`,
    `https://docs.google.com/document/u/12/d/${id}/edit?tab=t.0#heading=h.example`,
    `https://docs.google.com/document/u/1/d/${id}?usp=sharing`,
    `https://docs.google.com/document/d/${id}/preview`,
    ` https://docs.google.com/document/u/0/d/${id}/edit?usp=sharing \n`,
  ]) {
    test(`extracts ${JSON.stringify(value)}`, () => {
      expect(parseGoogleDocId(value)).toBe(id);
    });
  }

  for (const value of [
    '',
    'short-id',
    `${id}/edit`,
    `${id}?usp=sharing`,
    `https://example.com/document/d/${id}/edit`,
    `https://docs.google.com.example.com/document/d/${id}/edit`,
    `https://docs.google.com@evil.example/document/d/${id}/edit`,
    `https://user@docs.google.com/document/d/${id}/edit`,
    `https://docs.google.com:444/document/d/${id}/edit`,
    `http://docs.google.com/document/d/${id}/edit`,
    `https://docs.google.com/spreadsheets/d/${id}/edit`,
    `https://docs.google.com/document/u/me/d/${id}/edit`,
    'https://docs.google.com/document/u/0/d//edit',
    'https://docs.google.com/document/d/short/edit',
    `https://docs.google.com/document/d/${id}.bad/edit`,
    `https://docs.google.com/document/d/${id}%2Fbad/edit`,
    `https://docs.google.com/document/d/${id}\n/edit`,
    `https://docs.google.com\\document\\d\\${id}\\edit`,
    `https://docs.google.com/document/d/${id} more/edit`,
  ]) {
    test(`rejects ${JSON.stringify(value)}`, () => {
      expect(parseGoogleDocId(value)).toBeNull();
    });
  }
});
