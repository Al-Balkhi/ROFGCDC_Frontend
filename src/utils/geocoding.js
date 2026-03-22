export const fetchAddressFromCoordinates = async (lat, lng) => {
  if (!lat || !lng) return "";
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        return parts.slice(0, 2).map(p => p.trim()).join('، ');
      }
    }
  } catch (error) {
    console.error('Failed to geocode address:', error);
  }
  return "";
};
