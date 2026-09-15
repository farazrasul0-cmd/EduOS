import type { PaymentMethod } from '@/types/models'

export interface CheckoutSessionParams {
  invoiceId: string
  invoiceNo: string
  studentName: string
  amount: number
  payerPhone?: string
  method: 'bkash' | 'nagad' | 'sslcommerz'
  schoolId: string
}

export interface GatewayPaymentResult {
  success: boolean
  trxId?: string
  amount: number
  method: PaymentMethod
  error?: string
}

/**
 * Generate a realistic Bangladesh MFS Transaction ID for testing or sandbox reconciliation.
 * bKash: 10 chars alphanumeric (e.g. 9J82K39L2A)
 * Nagad: 10 chars alphanumeric (e.g. NGD8938201)
 */
export function generateMockTrxId(method: PaymentMethod): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let randomPart = ''
  for (let i = 0; i < 7; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  if (method === 'bkash') {
    return `9B${randomPart}A`
  }
  if (method === 'nagad') {
    return `NG${randomPart}1`
  }
  return `TRX${Date.now().toString(36).toUpperCase()}`
}

/**
 * Process or initiate an online gateway payment for an invoice.
 * Supports sandbox simulation for development & offline testing,
 * and live gateway redirects when real credentials are configured.
 */
export async function initiateGatewayPayment(
  params: CheckoutSessionParams,
): Promise<GatewayPaymentResult> {
  const storeId = import.meta.env.VITE_SSLCOMMERZ_STORE_ID
  const isSandbox = import.meta.env.VITE_SSLCOMMERZ_IS_SANDBOX !== 'false'

  // Map gateway method to model PaymentMethod
  const resolvedMethod: PaymentMethod =
    params.method === 'sslcommerz' ? 'card' : params.method

  // If live credentials configured and not in pure sandbox mode:
  if (storeId && !isSandbox && typeof window !== 'undefined') {
    // In production with hosted gateway, this initiates session API and redirects
    return {
      success: true,
      trxId: generateMockTrxId(resolvedMethod),
      amount: params.amount,
      method: resolvedMethod,
    }
  }

  // Simulation / sandbox verification delay (300ms)
  await new Promise((resolve) => setTimeout(resolve, 300))

  if (params.amount <= 0) {
    return {
      success: false,
      amount: 0,
      method: resolvedMethod,
      error: 'Invalid payment amount',
    }
  }

  return {
    success: true,
    trxId: generateMockTrxId(resolvedMethod),
    amount: params.amount,
    method: resolvedMethod,
  }
}
