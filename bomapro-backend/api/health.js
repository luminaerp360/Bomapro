/**
 * Health check endpoint - ultra-minimal for diagnostics
 * Vercel routes this through vercel.json
 */
module.exports = async function health(req, res) {
  console.log('[HEALTH] Request received at', new Date().toISOString());
  res.status(200).json({
    ok: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongodb: process.env.MONGODB_URI ? 'configured' : 'NOT CONFIGURED',
  });
};
