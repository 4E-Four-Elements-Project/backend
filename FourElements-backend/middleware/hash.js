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

export default hashPassword;