export interface Event {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  price: string;
  image: string;
  category: string;
  attendees: number;
  description: string;
  organizer: string;
  organizerImage: string;
}

export const EVENT_IMAGES = {
  concert1: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop',
  concert2: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop',
  concert3: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=300&fit=crop',
  festival1: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop',
  festival2: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop',
  party1: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop',
  party2: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop',
  party3: 'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=400&h=300&fit=crop',
  dj1: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=400&h=300&fit=crop',
  crowd1: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=300&fit=crop',
  crowd2: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop',
  stage1: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
};

export const ONBOARDING_IMAGES = [
  [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&h=250&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=180&fit=crop',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&h=250&fit=crop',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&h=280&fit=crop',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=200&h=200&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&h=250&fit=crop',
    'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=200&h=180&fit=crop',
    'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=200&h=250&fit=crop',
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=200&h=280&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
  ],
  [
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=200&h=250&fit=crop',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&h=180&fit=crop',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&h=250&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&h=280&fit=crop',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=200&h=200&fit=crop',
  ],
];

export const PROFILE_IMAGES = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
];

export const AVATAR_IMAGES = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop',
];

export const EVENTS: Event[] = [
  {
    id: '1',
    title: 'Satellite mega festival - 2023',
    location: 'New York',
    date: 'THU 26 May, 09:00',
    time: '09:00',
    price: '$30.00',
    image: EVENT_IMAGES.festival1,
    category: 'Music',
    attendees: 45,
    description: 'We have a team but still missing a couple of people. Let\'s play together! We have a team but still missing a couple of people. We have a team but still missing a couple of people',
    organizer: 'Wade Warren',
    organizerImage: AVATAR_IMAGES[0],
  },
  {
    id: '2',
    title: 'Party with friends at night - 2023',
    location: 'California',
    date: 'THU 26 May, 09:00',
    time: '09:00',
    price: '$30.00',
    image: EVENT_IMAGES.party1,
    category: 'Party',
    attendees: 40,
    description: 'We have a team but still missing a couple of people. Let\'s play together! We have a team but still missing a couple of people. We have a team but still missing a couple of people',
    organizer: 'Wade Warren',
    organizerImage: AVATAR_IMAGES[1],
  },
  {
    id: '3',
    title: 'Going to a Rock Concert',
    location: 'Ahmedabad',
    date: 'THU 26 May, 09:00 - FRI 27 May, 10:00',
    time: '09:00',
    price: '$30.00',
    image: EVENT_IMAGES.concert1,
    category: 'Dance',
    attendees: 15,
    description: 'We have a team but still missing a couple of people. Let\'s play together! We have a team but still missing a couple of people. We have a team but still missing a couple of people',
    organizer: 'Wade Warren',
    organizerImage: AVATAR_IMAGES[2],
  },
  {
    id: '4',
    title: 'Dance party at the top of the town - 2022',
    location: 'New York',
    date: 'THU 26 May, 09:00',
    time: '09:00',
    price: '$30.00',
    image: EVENT_IMAGES.concert2,
    category: 'Dance',
    attendees: 30,
    description: 'We have a team but still missing a couple of people. Let\'s play together! We have a team but still missing a couple of people.',
    organizer: 'Wade Warren',
    organizerImage: AVATAR_IMAGES[0],
  },
  {
    id: '5',
    title: 'Festival event at kudasan - 2022',
    location: 'California',
    date: 'THU 26 May, 09:00',
    time: '09:00',
    price: 'Free',
    image: EVENT_IMAGES.festival2,
    category: 'Music',
    attendees: 20,
    description: 'We have a team but still missing a couple of people. Let\'s play together!',
    organizer: 'Wade Warren',
    organizerImage: AVATAR_IMAGES[1],
  },
  {
    id: '6',
    title: 'Party with friends at night - 2022',
    location: 'Miami',
    date: 'THU 26 May, 09:00',
    time: '09:00',
    price: 'Free',
    image: EVENT_IMAGES.party2,
    category: 'Party',
    attendees: 25,
    description: 'We have a team but still missing a couple of people.',
    organizer: 'Wade Warren',
    organizerImage: AVATAR_IMAGES[2],
  },
  {
    id: '7',
    title: 'Satellite mega festival - 2022',
    location: 'California',
    date: 'THU 26 May, 09:00',
    time: '09:00',
    price: '$30.00',
    image: EVENT_IMAGES.crowd1,
    category: 'Music',
    attendees: 50,
    description: 'We have a team but still missing a couple of people.',
    organizer: 'Wade Warren',
    organizerImage: AVATAR_IMAGES[3],
  },
];

export const CATEGORIES = [
  { id: '1', name: 'Music', emoji: '🎵' },
  { id: '2', name: 'Education', emoji: '👩‍🎓' },
  { id: '3', name: 'Film & Media', emoji: '🎬' },
  { id: '4', name: 'Food & Drink', emoji: '🍕' },
  { id: '5', name: 'Sport', emoji: '⚽' },
  { id: '6', name: 'Party', emoji: '🎉' },
];

export const FAVOURITE_CATEGORIES = [
  { id: '1', name: 'Business', emoji: '💼' },
  { id: '2', name: 'Community', emoji: '🙌' },
  { id: '3', name: 'Music & Entertainment', emoji: '🎵' },
  { id: '4', name: 'Health', emoji: '🩺' },
  { id: '5', name: 'Food & drink', emoji: '🍕' },
  { id: '6', name: 'Family & Education', emoji: '👩‍🎓' },
  { id: '7', name: 'Sport', emoji: '⚽' },
  { id: '8', name: 'Fashion', emoji: '👠' },
  { id: '9', name: 'Film & Media', emoji: '🎬' },
  { id: '10', name: 'Home & Lifestyle', emoji: '🏠' },
  { id: '11', name: 'Design', emoji: '🎨' },
  { id: '12', name: 'Gaming', emoji: '🎮' },
  { id: '13', name: 'Science & Tech', emoji: '🔬' },
  { id: '14', name: 'School & Education', emoji: '📚' },
  { id: '15', name: 'Holiday', emoji: '🎊' },
  { id: '16', name: 'Travel', emoji: '🎆' },
];
