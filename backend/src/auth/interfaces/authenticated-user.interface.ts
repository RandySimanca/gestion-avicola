import * as admin from 'firebase-admin';

export interface AuthenticatedUser extends admin.auth.DecodedIdToken {
  role?: string;
}
