const fs = require('fs');
const glob = require('glob');

const files = [
  'app/(tabs)/favorites.tsx',
  'app/(tabs)/home.tsx',
  'app/(tabs)/profile.tsx',
  'app/(tabs)/search.tsx',
  'app/booking-detail.tsx',
  'app/bookings.tsx',
  'app/category-venues.tsx',
  'app/edit-profile.tsx',
  'app/notifications.tsx',
  'app/select-favourite.tsx',
  'app/venue-detail.tsx',
  'app/view-booking.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/fetchVenues\(supabase,\s*/g, 'fetchVenues(');
  content = content.replace(/fetchVenues\(supabase\)/g, 'fetchVenues()');
  content = content.replace(/fetchCategories\(supabase\)/g, 'fetchCategories()');
  content = content.replace(/fetchUser\(supabase,\s*/g, 'fetchUser(');
  content = content.replace(/fetchVenueById\(supabase,\s*/g, 'fetchVenueById(');
  content = content.replace(/fetchVenuesByCategory\(supabase,\s*/g, 'fetchVenuesByCategory(');
  content = content.replace(/fetchBookings\(supabase,\s*/g, 'fetchBookings(');
  content = content.replace(/fetchBookingById\(supabase,\s*/g, 'fetchBookingById(');
  content = content.replace(/createBooking\(supabase,\s*/g, 'createBooking(');
  content = content.replace(/fetchNotifications\(supabase,\s*/g, 'fetchNotifications(');
  content = content.replace(/markNotificationRead\(supabase,\s*/g, 'markNotificationRead(');
  content = content.replace(/updateUser\(supabase,\s*/g, 'updateUser(');
  content = content.replace(/const { supabase } = useAuth\(\);/g, '');
  content = content.replace(/const { supabase, dbUser } = useAuth\(\);/g, 'const { dbUser } = useAuth();');
  content = content.replace(/const { dbUser, supabase } = useAuth\(\);/g, 'const { dbUser } = useAuth();');
  content = content.replace(/supabase, /g, '');
  fs.writeFileSync(file, content);
});
console.log('Fixed API calls');
