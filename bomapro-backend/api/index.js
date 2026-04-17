module.exports = async function handler(req, res) {
  res.status(200).json({ ok: true, message: 'API is running', time: new Date().toISOString() });
};
  } catch (error) {
    console.error('[Serverless Handler Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'Server initialization failed' : String(error),
    });
  }
};
