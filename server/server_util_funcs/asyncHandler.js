/**
 * asyncHandler
 *
 * Wraps an async Express route handler so that rejected promises are
 * forwarded to the error-handling middleware via next(err).
 *
 * Express 4 does NOT automatically catch promise rejections from async
 * handlers. Without this wrapper, a rejected promise produces an unhandled
 * rejection and the client request hangs with no response. This wrapper is
 * the single place that fixes that for every route in app.js.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
