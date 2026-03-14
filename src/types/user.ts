export const USER_ROLES = {
  COORDINATOR: "supply_coordinator",
  KITCHEN: "central_kitchen_staff",
  STORE: "franchise_store_staff",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
