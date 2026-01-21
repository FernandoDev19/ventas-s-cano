import * as bcrypt from 'bcrypt';

export const hashPassword = async (password: string, salts: number = 10) => {
    return await bcrypt.hash(password, salts);
}

export const comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
}