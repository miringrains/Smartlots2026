/* eslint-disable @typescript-eslint/no-explicit-any */

export interface UserDTO {
  id: string;
  email: string;
  userType: string;
  locationId: string | null;
  companyId: string | null;
  createdAt: string;
  isFirstLogin: boolean;
  requiresPasswordChange: boolean;
  isSuspended: boolean;
  location?: {
    id: string;
    name: string;
    address: string;
  } | null;
}

export interface TicketDTO {
  id: string;
  userId: string;
  locationId: string;
  email: string;
  ticketNumber: string | null;
  vin: string;
  make: string;
  year: number;
  model: string;
  licensePlate: string;
  nFiles: number;
  images: string[];
  ticketState: string;
  createdAt: string;
  updatedAt: string;
  parking?: ParkingDTO | null;
}

export interface ParkingDTO {
  locationId: string | null;
  locationName: string | null;
  isBlocked: boolean;
  blockingNotes: string;
  parkingPhoto: string | null;
  parkedAt: string;
}

export interface MovementDTO {
  id: string;
  movedBy: string;
  movedByEmail: string;
  fromLocationId: string | null;
  fromLocationName: string | null;
  toLocationId: string | null;
  toLocationName: string;
  movedAt: string;
  reason: string | null;
}

export interface LocationDTO {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  capacity: number;
  occupied: number;
  available: number;
}

export interface OccupancyDTO {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  available: number;
  occupancyRate: number;
}

export function mapUser(row: any): UserDTO {
  return {
    id: row.id,
    email: row.email,
    userType: row.user_type,
    locationId: row.location_id,
    companyId: row.company_id,
    createdAt: row.created_at,
    isFirstLogin: row.is_first_login,
    requiresPasswordChange: row.requires_password_change,
    isSuspended: row.is_suspended ?? false,
    location: row.locations
      ? {
          id: row.locations.id,
          name: row.locations.name,
          address: row.locations.address,
        }
      : null,
  };
}

export function mapTicket(row: any): TicketDTO {
  return {
    id: row.id,
    userId: row.user_id,
    locationId: row.location_id,
    email: row.email,
    ticketNumber: row.ticket_number,
    vin: row.vin,
    make: row.make,
    year: row.year,
    model: row.model,
    licensePlate: row.license_plate,
    nFiles: row.n_files,
    images: row.ticket_images
      ? row.ticket_images.map((img: any) => img.public_url)
      : [],
    ticketState: row.ticket_state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parking: row.ticket_parking
      ? {
          locationId: row.ticket_parking.location_id,
          locationName: row.ticket_parking.location_name,
          isBlocked: row.ticket_parking.is_blocked,
          blockingNotes: row.ticket_parking.blocking_notes,
          parkingPhoto: row.ticket_parking.parking_photo,
          parkedAt: row.ticket_parking.parked_at,
        }
      : null,
  };
}

export function mapMovement(row: any): MovementDTO {
  return {
    id: row.id,
    movedBy: row.moved_by,
    movedByEmail: row.moved_by_email,
    fromLocationId: row.from_location_id || null,
    fromLocationName: row.from_location_name || null,
    toLocationId: row.to_location_id || null,
    toLocationName: row.to_location_name,
    movedAt: row.moved_at,
    reason: row.reason || null,
  };
}
