'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface CartContextValue {
  cartCount: number
  setCartCount: (n: number) => void
}

const CartContext = createContext<CartContextValue>({
  cartCount: 0,
  setCartCount: () => {},
})

export function useCart() {
  return useContext(CartContext)
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [cartCount, setCartCount] = useState(0)

  return (
    <CartContext.Provider value={{ cartCount, setCartCount }}>
      {children}
    </CartContext.Provider>
  )
}
