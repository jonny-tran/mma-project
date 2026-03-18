import { create } from "zustand";
import type { ReceiveItemDto } from "../types/shipment";

export interface ScanData {
  batchId: number;
  productId: number;
  expectedQty: number;
  actualQty: number;
  damagedQty: number;
  evidenceUrls: string[];
}

interface ReceivingState {
  currentShipmentId: string | null;
  scannedItems: Record<number, ScanData>;
  notes: string;

  startNewSession: (shipmentId: string, items: ScanData[]) => void;
  updateActualQty: (batchId: number, val: number) => void;
  updateDamagedQty: (batchId: number, val: number) => void;
  updateEvidence: (batchId: number, urls: string[]) => void;
  setNotes: (notes: string) => void;
  resetSession: () => void;
  getReceivePayload: () => { items: ReceiveItemDto[]; notes: string };
  hasDiscrepancies: () => boolean;
  getUnresolvedDiscrepancies: () => ScanData[];
}

export const useReceivingStore = create<ReceivingState>()((set, get) => ({
  currentShipmentId: null,
  scannedItems: {},
  notes: "",

  startNewSession: (shipmentId, items) => {
    const itemMap: Record<number, ScanData> = {};
    items.forEach((item) => {
      itemMap[item.batchId] = item;
    });
    set({ currentShipmentId: shipmentId, scannedItems: itemMap, notes: "" });
  },

  updateActualQty: (batchId, val) => {
    set((state) => {
      const item = state.scannedItems[batchId];
      if (!item) return state;
      return {
        scannedItems: {
          ...state.scannedItems,
          [batchId]: { ...item, actualQty: Math.max(0, val) },
        },
      };
    });
  },

  updateDamagedQty: (batchId, val) => {
    set((state) => {
      const item = state.scannedItems[batchId];
      if (!item) return state;
      return {
        scannedItems: {
          ...state.scannedItems,
          [batchId]: { ...item, damagedQty: Math.max(0, val) },
        },
      };
    });
  },

  updateEvidence: (batchId, urls) => {
    set((state) => {
      const item = state.scannedItems[batchId];
      if (!item) return state;
      return {
        scannedItems: {
          ...state.scannedItems,
          [batchId]: { ...item, evidenceUrls: urls },
        },
      };
    });
  },

  setNotes: (notes) => set({ notes }),

  resetSession: () =>
    set({ currentShipmentId: null, scannedItems: {}, notes: "" }),

  getReceivePayload: () => {
    const { scannedItems, notes } = get();
    const items: ReceiveItemDto[] = Object.values(scannedItems).map((val) => ({
      batchId: val.batchId,
      actualQty: val.actualQty,
      damagedQty: val.damagedQty,
      evidenceUrls:
        val.evidenceUrls.length > 0 ? val.evidenceUrls : undefined,
    }));
    return { items, notes };
  },

  hasDiscrepancies: () => {
    const { scannedItems } = get();
    return Object.values(scannedItems).some(
      (item) => item.actualQty < item.expectedQty || item.damagedQty > 0
    );
  },

  getUnresolvedDiscrepancies: () => {
    const { scannedItems } = get();
    return Object.values(scannedItems).filter(
      (item) =>
        (item.actualQty < item.expectedQty || item.damagedQty > 0) &&
        item.evidenceUrls.length === 0
    );
  },
}));
