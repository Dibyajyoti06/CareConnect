const executeWithRetry = async (fn, { retries = 3, delay = 1000, exponential = false } = {}) => {
  try {
    return await fn();
  } catch (err) {
    if (retries === 1) throw err;

    console.warn(`⚠️ Retry in ${delay / 1000}s... (${retries - 1} attempts left)`);

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Increase delay if exponential backoff is enabled
    const nextDelay = exponential ? delay * 2 : delay;

    return retry(fn, { retries: retries - 1, delay: nextDelay, exponential });
  }
};

export default executeWithRetry;