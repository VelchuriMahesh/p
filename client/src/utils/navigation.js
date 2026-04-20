export const getRouteForRole = (role) => {
  if (role === 'super_admin') {
    return '/admin';
  }

  if (role === 'ngo_admin') {
    return '/ngo-dashboard';
  }

  return '/home';
};

