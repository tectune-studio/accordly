import 'server-only';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { assertPermission, roleFromClerk } from './permissions.mjs';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export type Actor = {
  userId: string;
  orgId: string;
  role: 'admin' | 'editor' | 'viewer';
  orgName: string;
  token?: string;
};
export async function requireOrganization(
  operation: 'read' | 'edit' | 'publish' | 'manage' = 'read',
): Promise<Actor> {
  const { userId, orgId } = await auth();
  if (!userId) throw new HttpError(401, 'Sign in to continue.');
  if (!orgId) throw new HttpError(409, 'Select or create an organization.');
  const clerk = await clerkClient();
  // Query current membership on EVERY administrative request; do not trust a stale session role.
  const memberships = await clerk.organizations.getOrganizationMembershipList({
    organizationId: orgId,
    userId: [userId],
    limit: 1,
  });
  const membership = memberships.data.find((m) => m.publicUserData?.userId === userId);
  const role = membership && roleFromClerk(membership.role);
  if (!role) throw new HttpError(403, 'Active organization membership is required.');
  assertPermission(role, operation);
  const organization = await clerk.organizations.getOrganization({ organizationId: orgId });
  return { userId, orgId, role: role as Actor['role'], orgName: organization.name };
}
