const WA_NUMBER = '919366946633'
const BRAND = 'MAD BALLERS — BALLER ZONE'

export function getWhatsAppLink(productName?: string): string {
  const message = productName
    ? `Hi! I'm interested in ordering *${productName}* from *${BRAND}*. Please share details and availability.`
    : `Hi! I'd like to place an order from *${BRAND}*. Please guide me on available products.`

  const encoded = encodeURIComponent(message)
  return `https://wa.me/${WA_NUMBER}?text=${encoded}`
}

export const WA_DISPLAY = '+91 93669 46633'
export const WA_LINK = `https://wa.me/${WA_NUMBER}`
