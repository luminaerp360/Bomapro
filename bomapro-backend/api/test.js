module.exports = async function handler(req, res) {
  try {
    console.log('[Test Handler] Request received:', req.method, req.url);
    res.status(200).json({ 
      status: 'OK', 
      message: 'Serverless function is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Test Handler] Error:', error);
    res.status(500).json({ error: String(error) });
  }
};
