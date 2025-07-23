//password utility
import bcrypt from 'bcrypt';
//import jwt from 'jsonwebtoken';
//import app_config from '@/app/config';

export async function cryptPassword(password: string, saltRounds: number){  
    const hashedPwd = await bcrypt.hash(password, saltRounds);
    return hashedPwd;
}

export async function checkPassword(password: string, hashed: string){
    const match = await bcrypt.compare(password, hashed);
    return match;
}



