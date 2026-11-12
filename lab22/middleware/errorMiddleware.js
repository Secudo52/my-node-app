async function errorMiddleware(ctx, next) {
  try {
    await next();
  } catch (err) {
    let status = err.status || 500;
    let message = err.message || 'Internal Server Error';
    if (err.code === 'ER_DUP_ENTRY') {
      status = 409;
      message = 'Conflict: duplicate entry';
    } else if (err.code === 'ER_NO_REFERENCED_ROW' || err.code === 'ER_NO_REFERENCED_ROW_2') {
      status = 400;
      message = 'Bad Request: foreign key constraint';
    } else if (err.code === 'ECONNREFUSED') {
      status = 503;
      message = 'Service Unavailable: MySQL connection refused';
    }
    ctx.status = status;
    ctx.body = { error: message, status };
  }
}

module.exports = errorMiddleware;
