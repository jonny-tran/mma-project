import { create } from "zustand";
import {
  setItemAsync,
  getItemAsync,
} from "../utils/storage";
import type { Product } from "../types/product";

const CART_STORAGE_KEY = "cart-storage";

// ──── Types ────

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  _hasHydrated: boolean;

  addItem: (product: Product, quantity: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: number) => number;
}

// ──── Helpers ────

function saveCart(items: CartItem[]) {
  setItemAsync(CART_STORAGE_KEY, JSON.stringify(items)).catch(() => {});
}

// ──── Store ────

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  _hasHydrated: false,

  addItem: (product, quantity) => {
    if (quantity <= 0) return;
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) => i.product.id === product.id,
      );
      let next: CartItem[];
      if (existingIndex >= 0) {
        next = [...state.items];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
      } else {
        next = [...state.items, { product, quantity }];
      }
      saveCart(next);
      return { items: next };
    });
  },

  updateQuantity: (productId, quantity) => {
    set((state) => {
      const next =
        quantity <= 0
          ? state.items.filter((i) => i.product.id !== productId)
          : state.items.map((i) =>
              i.product.id === productId ? { ...i, quantity } : i,
            );
      saveCart(next);
      return { items: next };
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const next = state.items.filter((i) => i.product.id !== productId);
      saveCart(next);
      return { items: next };
    });
  },

  clearCart: () => {
    saveCart([]);
    set({ items: [] });
  },

  getItemQuantity: (productId) => {
    return get().items.find((i) => i.product.id === productId)?.quantity ?? 0;
  },
}));

// ──── Hydrate from storage on app start ────

async function hydrateCart() {
  try {
    const raw = await getItemAsync(CART_STORAGE_KEY);
    if (raw) {
      const items: CartItem[] = JSON.parse(raw);
      useCartStore.setState({ items, _hasHydrated: true });
    } else {
      useCartStore.setState({ _hasHydrated: true });
    }
  } catch {
    useCartStore.setState({ _hasHydrated: true });
  }
}

hydrateCart();
