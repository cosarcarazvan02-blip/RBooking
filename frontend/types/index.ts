export interface Accommodation {
  id: string;
  name: string;
  location: string;
  city?: string;
  country?: string;
  imageUrl?: string;
  accommodationType?: string;
  pricePerNight?: number;
  averageRating?: number;
  stars?: number;
  description?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Client' | 'Operator' | 'Admin' | string;
  profileImagePath?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
