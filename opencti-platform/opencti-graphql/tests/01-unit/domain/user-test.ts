import { describe, expect, it } from 'vitest';
import { testContext } from '../../utils/testQuery';
import { checkPasswordInlinePolicy } from '../../../src/domain/user';

describe('password checker', () => {
  it('should no policy applied', async () => {
    const policy = {};
    expect(checkPasswordInlinePolicy(testContext, policy, '').length).toBe(1);
    expect(checkPasswordInlinePolicy(testContext, policy, 'a').length).toBe(0);
    expect(checkPasswordInlinePolicy(testContext, policy, '!').length).toBe(0);
  });
  it('should password_policy_min_length policy applied', async () => {
    expect(checkPasswordInlinePolicy(testContext, { password_policy_min_length: 4 }, '123').length).toBe(1);
    expect(checkPasswordInlinePolicy(testContext, { password_policy_min_length: 4 }, '1234').length).toBe(0);
  });
  it('should password_policy_min_symbols policy applied', async () => {
    expect(checkPasswordInlinePolicy(testContext, { password_policy_min_symbols: 4 }, '123é').length).toBe(1);
    expect(checkPasswordInlinePolicy(testContext, { password_policy_min_symbols: 4 }, '1!2!3$4$').length).toBe(0);
  });
  it('should password_policy_min_numbers policy applied', async () => {
    expect(checkPasswordInlinePolicy(testContext, { password_policy_min_numbers: 4 }, 'aaa').length).toBe(1);
    expect(checkPasswordInlinePolicy(testContext, { password_policy_min_numbers: 4 }, 'a1a2a3a4').length).toBe(0);
  });
  it('should password_policy_min_words policy applied', async () => {
    expect(checkPasswordInlinePolicy(testContext, { password_policy_min_words: 2 }, 'hello').length).toBe(1);
    expect(checkPasswordInlinePolicy(testContext, { password_policy_min_words: 2 }, 'hello-world').length).toBe(0);
    expect(checkPasswordInlinePolicy(testContext, { password_policy_min_words: 2 }, 'hello|world').length).toBe(0);
    expect(checkPasswordInlinePolicy(testContext, { password_policy_min_words: 2 }, 'hello world').length).toBe(0);
  });
  it('should password_policy_min_lowercase policy applied', async () => {
    expect(checkPasswordInlinePolicy(testContext, { password_policy_min_lowercase: 4 }, 'AAAA').length).toBe(1);
    expect(checkPasswordInlinePolicy(testContext, { password_policy_min_lowercase: 4 }, 'aaaa').length).toBe(0);
  });
  it('should password_policy_min_uppercase policy applied', async () => {
    expect(checkPasswordInlinePolicy(testContext, { password_policy_min_uppercase: 4 }, 'aXaaXa').length).toBe(1);
    expect(checkPasswordInlinePolicy(testContext, { password_policy_min_uppercase: 4 }, 'AxAxAxA)').length).toBe(0);
  });
  it('should comply policy applied', async () => {
    const policy = {
      password_policy_min_length: 10,
      password_policy_min_symbols: 2,
      password_policy_min_numbers: 3,
      password_policy_min_words: 3,
      password_policy_min_lowercase: 2,
      password_policy_min_uppercase: 2,
    };
    expect(checkPasswordInlinePolicy(testContext, policy, 'aXa77&&2aXa').length).toBe(1);
    expect(checkPasswordInlinePolicy(testContext, policy, 'ab-CD-&^123').length).toBe(0);
  });
});
