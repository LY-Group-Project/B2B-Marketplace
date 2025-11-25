import { create } from "zustand";
import { persist } from "zustand/middleware";

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,

      // Actions
      addItem: (product, quantity = 1, variant = null) => {
        const items = get().items;
        const existingItemIndex = items.findIndex(
          (item) =>
            item.product._id === product._id &&
            JSON.stringify(item.variant) === JSON.stringify(variant),
        );

        if (existingItemIndex > -1) {
          // Update existing item
          const updatedItems = items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
          set({ items: updatedItems });
        } else {
          // Add new item
          const newItem = {
            product,
            quantity,
            variant,
            addedAt: new Date().toISOString(),
          };
          set({ items: [...items, newItem] });
        }

        get().calculateTotals();
      },

      removeItem: (productId, variant = null) => {
        const items = get().items.filter(
          (item) =>
            !(
              item.product._id === productId &&
              JSON.stringify(item.variant) === JSON.stringify(variant)
            ),
        );
        set({ items });
        get().calculateTotals();
      },

      updateQuantity: (productId, quantity, variant = null) => {
        if (quantity <= 0) {
          get().removeItem(productId, variant);
          return;
        }

        const items = get().items.map((item) =>
          item.product._id === productId &&
          JSON.stringify(item.variant) === JSON.stringify(variant)
            ? { ...item, quantity }
            : item,
        );
        set({ items });
        get().calculateTotals();
      },

      clearCart: () => {
        set({ items: [], total: 0, itemCount: 0 });
      },

      calculateTotals: () => {
        const items = get().items;
        const total = items.reduce((sum, item) => {
          return sum + item.product.price * item.quantity;
        }, 0);
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        set({ total, itemCount });
      },

      // Get item by product and variant
      getItem: (productId, variant = null) => {
        return get().items.find(
          (item) =>
            item.product._id === productId &&
            JSON.stringify(item.variant) === JSON.stringify(variant),
        );
      },

      // Check if product is in cart
      isInCart: (productId, variant = null) => {
        return get().getItem(productId, variant) !== undefined;
      },
    }),
    {
      name: "cart-storage",
    },
  ),
);

export default useCartStore;
