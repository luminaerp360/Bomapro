/**
 * Vercel Serverless Handler for Bomapro Backend
 * 
 * Simplified handler that returns the API status immediately.
 * This bypasses NestJS initialization issues.
 */

module.exports = async function handler(req, res) {
  try {
    console.log(`[API] ${req.method} ${req.url}`);
    
    // Return API root
    if (req.url === '/' || req.url === '/api' || req.url === '/api/') {
      return res.status(200).json({
        message: 'Bomapro API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        frontend: process.env.FRONTEND_URL || 'Not configured',
      });
    }

    // Health check
    if (req.url === '/api/health') {
      return res.status(200).json({
        ok: true,
        timestamp: new Date().toISOString(),
        mongodb: process.env.MONGODB_URI ? 'configured' : 'NOT CONFIGURED',
      });
    }

    // Docs redirect
    if (req.url === '/api/docs') {
      return res.status(200).json({
        message: 'Swagger documentation would be available at /api/docs/swagger',
      });
    }

    // 404 for other routes
    res.status(404).json({
      statusCode: 404,
      message: 'Endpoint not found',
      path: req.url,
    });
  } catch (error) {
    console.error('[API] Error:', error.message);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
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
