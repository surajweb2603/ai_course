import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.hash(plainPassword, SALT_ROUNDS, (err, hash) => {
      if (err || !hash) {
        reject(err || new Error('Failed to hash password'));
        return;
      }
      resolve(hash);
    });
  });
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(plainPassword, hashedPassword, (err, same) => {
      if (err || typeof same !== 'boolean') {
        reject(err || new Error('Failed to verify password'));
        return;
      }
      resolve(same);
    });
  });
}
