export const ICON_STROKE_WIDTH = 1.75;
export const ICON_SIZE = 18;
export const ICON_SIZE_SM = 16;

export const TICKET_STATES = ["DOCUMENTED", "SERVICING", "READY", "DELIVERED"] as const;
export type TicketState = (typeof TICKET_STATES)[number];

export const SPOT_STATES = ["AVAILABLE", "OCCUPIED", "RESERVED", "BLOCKED"] as const;
export type SpotState = (typeof SPOT_STATES)[number];

export const USER_TYPES = ["USER", "ADMIN", "SUPER_ADMIN"] as const;
export type UserType = (typeof USER_TYPES)[number];
