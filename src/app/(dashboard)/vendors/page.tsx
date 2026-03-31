import { getVendors } from '@/actions/vendors'
import { VendorsClient } from './vendors-client'

export default async function VendorsPage() {
  const vendors = await getVendors()
  return <VendorsClient vendors={vendors} />
}
