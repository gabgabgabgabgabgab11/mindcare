import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../src/utils/signupErrors.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { describeSignupError } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('email limits are distinguished from invalid account details', () => {
  const message = describeSignupError({ code: 'over_email_send_rate_limit', status: 429 });
  assert.match(message, /Confirmation emails.*rate-limited/);
  assert.match(message, /Code: over_email_send_rate_limit/);
});
test('default SMTP restriction directs users to the team', () => {
  assert.match(describeSignupError({ code: 'email_address_not_authorized' }), /team.*fix email delivery/);
});
test('generic 429 and disabled signups give actionable explanations', () => {
  assert.match(describeSignupError({ status: 429 }), /rate-limited/);
  assert.match(describeSignupError({ code: 'signup_disabled' }), /registrations are currently unavailable/);
});
test('network failures do not imply a definitively failed registration', () => {
  assert.match(describeSignupError(new TypeError('Failed to fetch')), /in case the account was created/);
});
test('internal messages and unsafe identifiers are never displayed', () => {
  const secretMessage = 'database connection password should not be displayed';
  const message = describeSignupError({ code: '<script>unsafe</script>', message: secretMessage, status: 500 });
  assert.doesNotMatch(message, /database|password|script/);
});
