const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // JWT hataları için özel işleme
  if (err.name === 'TokenExpiredError' || 
      err.name === 'JsonWebTokenError' ||
      err.message.includes('token') ||
      err.message.includes('Token')) {
    // JWT hataları için daha temiz bir yanıt
    return res.status(401).json({
      message: 'Oturum süresi doldu veya kimlik doğrulama geçersiz. Lütfen tekrar giriş yapın.',
      tokenError: true
    });
  }
  
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export { notFound, errorHandler };
