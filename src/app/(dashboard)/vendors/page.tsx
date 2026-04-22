import { getVendors, getVendorAnalytics } from '@/actions/vendors'
import { VendorsClient } from './vendors-client'

export default async function VendorsPage() {
  const [vendors, analytics] = await Promise.all([getVendors(), getVendorAnalytics()])
  return <VendorsClient vendors={vendors} analytics={analytics} />
}
