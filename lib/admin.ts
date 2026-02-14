/** Only this email can create and resolve markets. */

export const ADMIN_EMAIL = "sohinibanerjee247@gmail.com";

export function isAdminEmail(email: string | undefined): boolean {
  return email?.toLowerCase() === ADMIN_EMAIL;
}
