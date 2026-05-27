import { Request, Response } from "express";

export async function geocode(req: Request, res: Response) {
  const { lat, lng } = req.query as { lat?: string; lng?: string };
  if (!lat || !lng) {
    res.status(400).json({ error: "lat and lng are required" });
    return;
  }

  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    res.status(500).json({ error: "Mapbox token not configured" });
    return;
  }

  // Try street address first, fall back to broader types if none found
  const addressUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=address&limit=1`;
  const addressRes = await fetch(addressUrl);
  const addressData = await addressRes.json();

  if (addressData.features?.length) {
    res.json(addressData);
    return;
  }

  const fallbackUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=neighborhood,locality,place&limit=1`;
  const fallbackRes = await fetch(fallbackUrl);
  const fallbackData = await fallbackRes.json();

  res.json(fallbackData);
}
