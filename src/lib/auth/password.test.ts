import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from './password';

describe('Password Utilities', () => {
  test('hashes password with salt and successfully verifies identical password', () => {
    const raw = 'SecureSecretPass123!';
    const hash = hashPassword(raw);
    assert.ok(hash.includes(':'));
    assert.equal(verifyPassword(raw, hash), true);
  });

  test('rejects incorrect password or tampered hash', () => {
    const raw = 'CorrectPassword';
    const hash = hashPassword(raw);
    assert.equal(verifyPassword('WrongPassword', hash), false);
    assert.equal(verifyPassword(raw, 'invalid:hash'), false);
    assert.equal(verifyPassword(raw, ''), false);
  });
});
