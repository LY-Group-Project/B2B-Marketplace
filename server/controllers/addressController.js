const axios = require("axios");

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

exports.autocomplete = async (req, res) => {
  const q = req.query.q;
  if (!MAPBOX_TOKEN) {
    return res.status(500).json({ message: "MAPBOX_TOKEN not configured on server" });
  }
  if (!q || q.trim().length === 0) {
    return res.status(400).json({ message: "Missing query parameter 'q'" });
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      q,
    )}.json`;
    const params = {
      access_token: MAPBOX_TOKEN,
      autocomplete: true,
      types: "address,place,locality,neighborhood,poi",
      limit: 8,
      language: "en",
    };
    // Don't restrict by country so Indian places show up

    const response = await axios.get(url, { params });
    // forward the features array to client
    return res.json({ features: response.data.features || [] });
  } catch (err) {
    console.error("Address autocomplete error:", err?.response?.data || err.message || err);
    return res.status(500).json({ message: "Failed to fetch address suggestions" });
  }
};
