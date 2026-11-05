export const AUTHORIZATION_WAIT_MS = 20 * 60 * 1000;

// The listener remains available while the user completes the one authorization.
// Clearing the timer on either result lets the temporary service stop promptly.
export function waitForAuthorization(done, timeoutMs = AUTHORIZATION_WAIT_MS) {
  let timer;
  const timeout = new Promise(resolve => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });
  return Promise.race([done, timeout]).finally(() => clearTimeout(timer));
}
