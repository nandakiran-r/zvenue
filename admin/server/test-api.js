import 'dotenv/config';
import jwt from 'jsonwebtoken';
import axios from 'axios';

async function test() {
  const token = jwt.sign({ id: '123', email: 'test@example.com' }, process.env.JWT_SECRET || 'supersecretkey_change_me_in_prod');
  const api = axios.create({
    baseURL: 'http://localhost:3001',
    headers: { Authorization: `Bearer ${token}` }
  });

  try {
    console.log("Testing Categories...");
    const catRes = await api.post('/api/categories', { name: 'Test Category', sort_order: 1 });
    const category = catRes.data;
    console.log("Category created:", category.id);

    console.log("Testing Venues...");
    const venueRes = await api.post('/api/venues', {
      name: 'Test Venue',
      city: 'Test City',
      category_id: category.id,
      price_per_hour: 50,
      price_per_day: 500,
      capacity: 100,
      amenities: ['wifi', 'ac'],
      description: 'A test venue'
    });
    const venue = venueRes.data;
    console.log("Venue created:", venue.id);

    console.log("Testing Venue GET...");
    const getVenue = await api.get(`/api/venues/${venue.id}`);
    console.log("Venue retrieved:", getVenue.data.name);
    
    console.log("Testing Venue PUT...");
    const putVenue = await api.put(`/api/venues/${venue.id}`, { name: 'Updated Venue' });
    console.log("Venue updated:", putVenue.data.name);

    console.log("Testing Venue DELETE...");
    await api.delete(`/api/venues/${venue.id}`);
    console.log("Venue deleted.");

    console.log("Testing Category DELETE...");
    await api.delete(`/api/categories/${category.id}`);
    console.log("Category deleted.");
    
    console.log("All CRUD operations tested successfully!");
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}
test();
