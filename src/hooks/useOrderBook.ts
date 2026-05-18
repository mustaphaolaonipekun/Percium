import { useState, useEffect, useRef } from 'react'

export interface OrderRow { price: number; size: number; total: number }
export interface OrderBook { asks: OrderRow[]; bids: OrderRow[]; spread: number }

function genBook(mid: number): OrderBook {
  const asks: OrderRow[] = [], bids: OrderRow[] = []
  for (let i = 1; i <= 10; i++) {
    const p = mid + i * 0.5 + Math.random() * 0.15
    const s = parseFloat((Math.random() * 6 + 0.1).toFixed(3))
    asks.push({ price: parseFloat(p.toFixed(2)), size: s, total: parseFloat((p * s).toFixed(2)) })
  }
  for (let i = 1; i <= 10; i++) {
    const p = mid - i * 0.5 - Math.random() * 0.15
    const s = parseFloat((Math.random() * 6 + 0.1).toFixed(3))
    bids.push({ price: parseFloat(p.toFixed(2)), size: s, total: parseFloat((p * s).toFixed(2)) })
  }
  return { asks, bids, spread: parseFloat((asks[0].price - bids[0].price).toFixed(3)) }
}

export function useOrderBook(price: number) {
  const [book, setBook] = useState<OrderBook>(() => genBook(price))
  const ref = useRef(price)
  useEffect(() => { ref.current = price }, [price])
  useEffect(() => {
    const t = setInterval(() => setBook(genBook(ref.current)), 1800)
    return () => clearInterval(t)
  }, [])
  return book
}
