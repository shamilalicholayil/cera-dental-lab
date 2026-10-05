export function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email ?? null,
    role: user.role,
    status: user.status,
  };
}
