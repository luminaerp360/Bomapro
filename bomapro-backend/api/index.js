'use strict';

// MINIMAL TEST HANDLER - NO NESTJS
module.exports = async function handler(req, res) {
  console.log('[MINIMAL] Received request:', req.method, req.url);
  res.status(200).json({
    status: 'OK',
    message: 'Minimal serverless handler working',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  });
};
  } catch (error) {
    console.error('[Serverless Handler Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'Server initialization failed' : String(error),
    });
  }
};
