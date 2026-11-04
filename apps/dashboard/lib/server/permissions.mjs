export const permissions = {
  read: ['admin', 'editor', 'viewer'],
  edit: ['admin', 'editor'],
  publish: ['admin'],
  manage: ['admin'],
};
export function roleFromClerk(role) {
  return (
    {
      'org:admin': 'admin',
      'org:editor': 'editor',
      'org:member': 'viewer',
      'org:viewer': 'viewer',
    }[role] || null
  );
}
export function assertPermission(role, operation) {
  if (!permissions[operation]?.includes(role)) {
    const error = new Error('You do not have permission for this operation.');
    error.status = 403;
    throw error;
  }
}
