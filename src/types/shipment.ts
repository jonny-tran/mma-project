export enum ShipmentStatus {
  PREPARING = 'preparing',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
}

export enum ClaimStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface ShipmentItem {
  batchId: number;
  batchCode: string;
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  expiryDate: string;
  imageUrl?: string;
  unit?: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  createdAt: string;
  order?: {
    id: string;
    storeId: string;
    storeName: string;
  };
  items: ShipmentItem[];
}

export interface ReceiveItemDto {
  batchId: number;
  actualQty: number;
  damagedQty: number;
  evidenceUrls?: string[];
}

export interface ReceiveShipmentDto {
  items: ReceiveItemDto[];
  notes?: string;
}

export interface ReceiveShipmentResponse {
  message: string;
  shipmentId: string;
  status: ShipmentStatus;
  hasDiscrepancy: boolean;
  claimId: string | null;
}

export interface ClaimItem {
  productName: string;
  sku: string;
  quantityMissing: number;
  quantityDamaged: number;
  reason: string;
  imageUrl: string;
}

export interface Claim {
  id: string;
  shipmentId: string;
  status: ClaimStatus;
  description?: string;
  createdAt: string;
  resolvedAt: string | null;
  items: ClaimItem[];
}

export interface CreateManualClaimItemDto {
  productId: number;
  batchId: number;
  quantityMissing: number;
  quantityDamaged: number;
  reason: string;
  imageProofUrl: string;
}

export interface CreateManualClaimDto {
  shipmentId: string;
  description: string;
  items: CreateManualClaimItemDto[];
}

export interface InventoryItem {
  inventoryId: number;
  batchId: number;
  productId: number;
  productName: string;
  sku: string;
  batchCode: string;
  quantity: number;
  expiryDate: string;
  unit: string;
  imageUrl: string;
}
