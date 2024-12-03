import bcrypt from "bcryptjs";

const hashPassword = async (password) => {
  const saltRounds = 12;  
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password: ', error)
        throw new Error('Error hashing password');
    }
}

const comparePassword = async (password, hashedPassword) => {
    try {
        const match = await bcrypt.compare(password, hashedPassword);
        return match;
    } catch (error) {
        console.error('Error comparing password: ', error)
        throw new Error('Error comparing password');
    }
}

export default {hashPassword, comparePassword};