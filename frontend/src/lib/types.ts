// Shared TypeScript types for PassPorto frontend

export type UserRole = 'citizen' | 'officer' | 'admin';

export interface User {
  id: string;
  email: string;
  nik?: string;
  full_name?: string;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthOutput {
  token: string;
  user: User;
}

export interface ImmigrationOffice {
  id: string;
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
}

export type ApplicationStatus = 'Pending' | 'Verified' | 'Printing' | 'Ready' | 'Completed';
export type PaymentStatus = 'Pending' | 'Verified' | 'Failed';

export interface Application {
  id: string;
  user_id: string;
  office_id: string;
  slot_id?: string;
  nik: string;
  full_name: string;
  birth_date: string;
  gender: string;
  address: string;
  status: ApplicationStatus;
  queue_number?: string;
  checked_in_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  application_id: string;
  amount: number;
  status: PaymentStatus;
  reference_id: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SlotPrediction {
  date: string;
  capacity: number;
  filled: number;
  available: number;
  occupancy_percent: number;
  recommended: boolean;
}

export interface CheckInResult {
  success: boolean;
  queue_number?: string;
  distance_meters: number;
  allowed_radius_meters: number;
  office_name: string;
  message: string;
}

export interface NIKValidationResult {
  is_valid: boolean;
  full_name?: string;
  nik: string;
  message: string;
}

// OCR extracted fields from KTP image
export interface OCRExtractedData {
  nik?: string;
  full_name?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
}
