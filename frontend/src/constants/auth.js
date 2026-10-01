export const ADMIN_EMAIL = 'midusabrian@gmail.com';

export const checkIsAdmin = (email) => {
  return Boolean(email && email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase());
};
