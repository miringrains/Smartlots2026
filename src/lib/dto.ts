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
  spotId: string | null;
  createdAt: string;
  updatedAt: string;
  spot?: SpotDTO | null;
  parking?: ParkingDTO | null;
}

export interface SpotDTO {
  id: string;
  label: string;
  lotId: string;
  spotState: string;
}

export interface ParkingDTO {
  lotId: string | null;
  lotName: string | null;
  isBlocked: boolean;
  blockingNotes: string;
  parkingPhoto: string | null;
  parkedAt: string;
}

export interface MovementDTO {
  id: string;
  movedBy: string;
  movedByEmail: string;
  fromLot: string | null;
  toLot: string;
  movedAt: string;
  isBlocked: boolean;
  blockingNotes: string;
}

export interface LotDTO {
  id: string;
  name: string;
  locationId: string;
  spots: SpotDTO[];
  location?: {
    id: string;
    name: string;
    address: string;
  };
}

export interface OccupancyDTO {
  id: string;
  name: string;
  totalSpots: number;
  availableSpots: number;
  occupiedSpots: number;
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
    spotId: row.spot_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    spot: row.spots
      ? { id: row.spots.id, label: row.spots.label, lotId: row.spots.lot_id, spotState: row.spots.spot_state }
      : null,
    parking: row.ticket_parking
      ? {
          lotId: row.ticket_parking.lot_id,
          lotName: row.ticket_parking.lot_name,
          isBlocked: row.ticket_parking.is_blocked,
          blockingNotes: row.ticket_parking.blocking_notes,
          parkingPhoto: row.ticket_parking.parking_photo,
          parkedAt: row.ticket_parking.parked_at,
        }
      : null,
  };
}

export function mapLot(row: any): LotDTO {
  return {
    id: row.id,
    name: row.name,
    locationId: row.location_id,
    spots: row.spots
      ? row.spots.map((s: any) => ({
          id: s.id,
          label: s.label,
          lotId: s.lot_id,
          spotState: s.spot_state,
        }))
      : [],
    location: row.locations
      ? { id: row.locations.id, name: row.locations.name, address: row.locations.address }
      : undefined,
  };
}

export function mapMovement(row: any): MovementDTO {
  return {
    id: row.id,
    movedBy: row.moved_by,
    movedByEmail: row.moved_by_email,
    fromLot: row.from_lot,
    toLot: row.to_lot,
    movedAt: row.moved_at,
    isBlocked: row.is_blocked,
    blockingNotes: row.blocking_notes,
  };
}
