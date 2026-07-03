import { create } from "zustand";

export interface BookingItem {
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  unitPrice: number;
}

export interface BookingIntent {
  eventId: string;
  eventTitle: string;
  items: BookingItem[];
}

interface BookingState {
  intent: BookingIntent | null;
  setIntent: (intent: BookingIntent) => void;
  updateQuantity: (ticketTypeId: string, quantity: number) => void;
  clearIntent: () => void;
  totalAmount: () => number;
}

export const useBookingStore = create<BookingState>()((set, get) => ({
  intent: null,

  setIntent: (intent) => set({ intent }),

  updateQuantity: (ticketTypeId, quantity) => {
    const intent = get().intent;
    if (!intent) return;
    set({
      intent: {
        ...intent,
        items: intent.items.map((item) =>
          item.ticketTypeId === ticketTypeId ? { ...item, quantity } : item
        ),
      },
    });
  },

  clearIntent: () => set({ intent: null }),

  totalAmount: () => {
    const intent = get().intent;
    if (!intent) return 0;
    return intent.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  },
}));
