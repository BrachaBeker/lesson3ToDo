const express = require('express');

const app = express();

// Render מגדיר את PORT בעצמו; 3000 משמש רק להרצה מקומית
const PORT = process.env.PORT || 3000;

const RENDER_SERVICES_URL = 'https://api.render.com/v1/services';

// מחזיר את רשימת השירותים בחשבון ה-Render (כ-JSON)
app.get('/services', async (req, res) => {
  // המפתח מגיע רק ממשתנה סביבה - אף פעם לא מהקוד
  const apiKey = process.env.RENDER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'RENDER_API_KEY environment variable is not set' });
  }

  try {
    const response = await fetch(RENDER_SERVICES_URL, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Render API request failed',
        status: response.status,
        details: data,
      });
    }

    res.json(data);
  } catch (err) {
    console.error('Failed to reach the Render API:', err);
    res.status(502).json({ error: 'Failed to reach the Render API' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
