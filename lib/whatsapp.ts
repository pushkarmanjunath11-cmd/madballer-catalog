const WA_NUMBER = '919366946633'
const BRAND = 'MAD BALLERS — BALLER ZONE'

export function getWhatsAppLink(productName?: string, imageUrl?: string): string {
  let message: string

  if (imageUrl) {
    // Product-specific enquiry — include the image URL so WhatsApp renders
    // a full image preview in the chat, letting the owner see exactly which boot.
    message =
      `Hi! I'm interested in ordering this boot from *${BRAND}*.\n\n` +
      `${imageUrl}\n\n` +
      `Please share the price and availability. Thank you! 🙏`
  } else if (productName) {
    message = `Hi! I'm interested in ordering *${productName}* from *${BRAND}*. Please share details and availability.`
  } else {
    message = `Hi! I'd like to place an order from *${BRAND}*. Please guide me on available products.`
  }

  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`
}

export const WA_DISPLAY = '+91 93669 46633'
export const WA_LINK = `https://wa.me/${WA_NUMBER}`
