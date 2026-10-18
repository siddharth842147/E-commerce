import { getAddresses } from "@/lib/actions/addresses";
import { AddressesClient } from "./AddressesClient";

export const instant = false;

export default async function AddressesPage() {
  const result = await getAddresses();
  const addresses = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Addresses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your saved delivery addresses
        </p>
      </div>
      <AddressesClient initialAddresses={addresses} />
    </div>
  );
}
