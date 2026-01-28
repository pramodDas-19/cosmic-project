// Vercel serverless function to proxy API requests
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method, headers, body } = req;
    const backendUrl = 'https://cosmicproject-backend-1.onrender.com';
    
    // Get the path from the query or URL
    let path = '';
    if (req.query.path) {
      path = `/${req.query.path}`;
    } else {
      // Remove the /api/proxy prefix from the URL
      path = req.url.replace('/api/proxy', '');
    }
    
    const targetUrl = `${backendUrl}/api${path}`;

    console.log(`Proxying request to: ${targetUrl}`);

    // Forward the request to the backend
    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 