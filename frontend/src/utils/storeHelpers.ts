/**
 * Store operation helpers to reduce boilerplate in async methods.
 */

/**
 * Extract user-facing error message from unknown error.
 */
export const getErrorMessage = (err: unknown, fallback: string): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
};

/**
 * Wrap async operation with loading state and error handling.
 * Usage: await withLoadingState(set, () => apiCall(), 'isLoading')
 */
export const withLoadingState = async <T>(
  set: (state: Record<string, unknown>) => void,
  operation: () => Promise<T>,
  loadingKey: string,
  errorFallback: string
): Promise<T | undefined> => {
  set({ [loadingKey]: true, error: null });
  try {
    const result = await operation();
    set({ [loadingKey]: false });
    return result;
  } catch (err) {
    set({
      error: getErrorMessage(err, errorFallback),
      [loadingKey]: false,
    });
  }
};
