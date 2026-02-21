import * as permissionRepo from '@/server/repositories/permission-repository';
import { PermissionTable } from './permission-tables';

export default async function PermissionListingPage() {
  const data = await permissionRepo.getAllPermissions();

  return <PermissionTable data={data} totalItems={data.length} />;
}
