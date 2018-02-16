async function runWithTimeout(task, timeout) {
  return await Promise.race([
    task,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout)),
  ]);
}

module.exports = runWithTimeout;