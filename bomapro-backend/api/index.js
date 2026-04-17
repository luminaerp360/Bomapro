/**
 * Vercel Serverless Handler for Bomapro Backend
 * Minimal Express-based API handler
 */

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log(`[API] ${req.method} ${req.url}`);
    
    // Root endpoint
    if (req.url === '/' || req.url === '') {
      return res.status(200).json({
        message: 'Bomapro API is running',
        version: '1.0.0',
      });
    }

    // Main API endpoint
    if (req.url.startsWith('/api')) {
      return res.status(200).json({
        message: 'Bomapro API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
      });
    }

    // 404
    res.status(404).json({
      statusCode: 404,
      message: 'Not found',
    });
  } catch (error) {
    console.error('[API] Error:', error.message, error.stack);
    res.status(500).json({
      statusCode: 500,
      message: 'Error',
      error: error.message,
    });
  }
};

  } catch (error) {
    console.error('[Serverless Handler Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'Server initialization failed' : String(error),
    });
  }
};
