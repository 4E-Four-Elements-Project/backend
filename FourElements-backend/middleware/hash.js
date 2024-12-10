import crypto from 'crypto';

const SALT_LENGTH = 16; // Length of the salt
const ITERATIONS = 100000; // Number of iterations for PBKDF2
const KEY_LENGTH = 64; // Length of the derived key
const DIGEST = 'sha512'; // Hash algorithm

const hashPassword = async (password) => {
  try {
    // Generate a random salt
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');

    // Derive a hashed password using PBKDF2
    const hashedPassword = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');

    // Store the salt and hash together, separated by a colon
    return `${salt}:${hashedPassword}`;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Error hashing password');
  }
};

const comparePassword = async (password, storedPassword) => {
  try {
    // Split the stored password into salt and hash
    const [salt, storedHash] = storedPassword.split(':');

    // Hash the provided password using the same salt
    const hashedPassword = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
    console.log('password: ', password);
    console.log('stored password: ', storedPassword);
    
    
    // Compare the provided hash with the stored hash
    return hashedPassword === storedHash;
  } catch (error) {
    console.error('Error comparing password:', error);
    throw new Error('Error comparing password');
  }
};

export default { hashPassword, comparePassword };


// import bcrypt from "bcryptjs";

// const hashPassword = async (password) => {
//   const saltRounds = 12;  
//     try {
//         const salt = await bcrypt.genSalt(saltRounds);
//         const hashedPassword = await bcrypt.hash(password, salt);
//         return hashedPassword;
//     } catch (error) {
//         console.error('Error hashing password: ', error)
//         throw new Error('Error hashing password');
//     }
// }

// const comparePassword = async (password, hashedPassword) => {
//     try {
//         const match = await bcrypt.compare(password, hashedPassword);
//         return match;
//     } catch (error) {
//         console.error('Error comparing password: ', error)
//         throw new Error('Error comparing password');
//     }
// }

// export default {hashPassword, comparePassword};