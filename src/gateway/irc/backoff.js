const createBackoff = () => {
  let attempt = 0;

  const reset = () => {
    attempt = 0;
  };

  const nextDelay = () => {
    attempt += 1;
    const delay = 1000 * Math.pow(2, attempt - 1);
    return Math.min(delay, 30000);
  };

  return { reset, nextDelay };
};

module.exports = {
  createBackoff,
};
