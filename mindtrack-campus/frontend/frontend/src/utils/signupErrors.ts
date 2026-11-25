type SignupError = { code?: string; status?: number; name?: string };

// Deliberately do not display provider messages, which can include internal details.
export function describeSignupError(error: unknown): string {
  const details: SignupError = typeof error === 'object' && error !== null ? error : {};
  const code = details.code;
  let message: string;
  switch (code) {
    case 'over_email_send_rate_limit':
      message = 'Confirmation emails are temporarily rate-limited. Please wait before trying again. If this continues, contact the MindCare team.';
      break;
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit_for_user':
      message = 'Too many requests. Please wait a few minutes before trying again.';
      break;
    case 'email_address_not_authorized':
    case 'email_address_not_authorized_to_receive_email':
      message = 'Confirmation email delivery is not configured for this address. Please contact the MindCare team so they can fix email delivery.';
      break;
    case 'signup_disabled':
    case 'email_provider_disabled':
      message = 'New email registrations are currently unavailable. Please contact the MindCare team.';
      break;
    case 'weak_password':
      message = 'This password does not meet the server’s security requirements. Try a longer password with uppercase and lowercase letters, numbers, and a symbol.';
      break;
    case 'email_address_invalid':
    case 'validation_failed':
      message = 'Please check your email address and password, then try again.';
      break;
    case 'user_already_exists':
    case 'email_exists':
      message = 'Try signing in or use Forgot? on the sign-in page to recover your account.';
      break;
    case 'captcha_failed':
      message = 'Account verification could not be completed. Please contact the MindCare team if this keeps happening.';
      break;
    default:
      message = details.name === 'AuthRetryableFetchError' || error instanceof TypeError
        ? 'We could not reach the account service. Check your connection. Before retrying, check your inbox or try signing in in case the account was created.'
        : details.status === 429
          ? 'Registration is temporarily rate-limited. Please wait before trying again.'
          : 'The account service could not finish registration. Please try again later or contact the MindCare team.';
  }
  // Only expose a safe machine-readable identifier, never the raw message or request.
  return code && /^[a-z0-9_]+$/.test(code) ? `${message} (Code: ${code})` : message;
}
