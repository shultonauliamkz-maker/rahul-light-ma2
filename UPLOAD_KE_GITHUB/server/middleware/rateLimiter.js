/**
 * Lightweight in-memory Rate Limiter for RAHUL LIGHT production server
 * Protects conversion & upload endpoints from DDoS and spam abuses
 */

const ipHits = new Map();

// Periodic cleanup of expired IP records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipHits.entries()) {
    if (now > data.resetTime) {
      ipHits.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export function rateLimiter({ windowMs = 15 * 60 * 1000, max = 100, message = 'Terlalu banyak permintaan dari IP ini. Silakan coba lagi nanti.' } = {}) {
  return (req, res, next) => {
    // Skip rate limiting for static assets or health check
    if (req.path === '/health' || req.path === '/versions') {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    let record = ipHits.get(ip);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      ipHits.set(ip, record);
      return next();
    }

    record.count++;
    if (record.count > max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: retryAfterSec
      });
    }

    next();
  };
}
