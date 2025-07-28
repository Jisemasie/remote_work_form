'use server'

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { getUserLoginDetails } from '@/app/lib/user_actions'
import bcrypt from 'bcryptjs';
import fetchData from './app/lib/fetchdata';
import { LoginData } from './app/lib/definitions';
import type { User } from 'next-auth';
import { v4 as uuidv4 } from "uuid";


interface ADAuthResponse {
  authenticated: boolean,
  cn: string,
  title: string,
  error: string
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ username: z.string(), password: z.string().min(6) })
          .safeParse(credentials);
        if (parsedCredentials.success) {
          const { username, password } = parsedCredentials.data;
          const dbUser = await getUserLoginDetails(username);
          if (!dbUser) return null;
          if ((dbUser as LoginData).auth_type == 'local') {  // local authentication
            const passwordsMatch = await bcrypt.compare(password, String((dbUser as LoginData).password));
            if (passwordsMatch) return dbUser;
          } else {  // active directory authentication
            const body = {
              username: username,
              password: password
            }
            const result: ADAuthResponse = await fetchData(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ad_auth`, 'POST', body)
            if (result && result.authenticated) {

              // Convert to NextAuth User type
              const user: User = {
                id: dbUser.id_user?.toString() ?? '', // Convert number to string
                name: dbUser.fullname ?? '',
                fullName: dbUser.fullname ?? '',
                username: dbUser.username ?? '',
                email: dbUser.email ?? '',
                profileName: dbUser.profile_name ?? '',
                profileId: dbUser.profileid,
                orgId: dbUser.id_organisation ?? 0,
                orgName: dbUser.nom_organisation ?? '',
                schoolId: dbUser.id_ecole ?? 0,
                accessLevel: dbUser.access_level ?? '',
                sessionId: uuidv4(), // Generate a new session ID
                registration_number: dbUser.registration_number ?? '',
                position: dbUser.position ?? '',
                issupervisor: dbUser.issupervisor ?? false,
                superviseur: dbUser.superviseur ?? '',
                branch: dbUser.branch ?? '',
              };

              return user;
            } else {

              //comment = "Wrong password";
              return null;

            }

          }
        }
        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});