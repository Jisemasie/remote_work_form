import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 1 * 1 * 65 * 60, // 7 days (adjust as needed)
  },
  jwt: {
    maxAge: 1 * 1 * 65 * 60, // Sync with session.maxAge
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // const isLoggedIn = !!auth?.user;
      const isLoggedIn = true;
      const isOnDashboard = nextUrl.pathname.startsWith('/main');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/main', nextUrl));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.fullName = user.fullName;
        token.username = user.username;
        token.lastLogin = user.lastLogin ?? new Date().toISOString();
        token.branch = user.branch;
        token.branchName = user.branchName;
        token.profileName = user.profileName;
        token.profileId = user.profileId;
        token.accessLevel = user.accessLevel;
        token.accessToken = user.sessionId;
        token.registration_number = user.registration_number;
        token.position = user.position;
        token.issupervisor = user.issupervisor;
        token.superviseur = user.superviseur;
        token.branch = user.branch;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.fullName = token.fullName as string | undefined;
        session.user.username = token.username as string | undefined;
        session.user.lastLogin = token.lastLogin as string | undefined;
        session.user.branch = token.branch as number | undefined;
        session.user.branchName = token.branchName as string | undefined;
        session.user.profileName = token.profileName as string | undefined;
        session.user.profileId = token.profileId as number;
        session.user.accessLevel = token.accessLevel as string | undefined;
        session.user.sessionId = token.accessToken as string;
        session.sessionToken = token.accessToken as string;
        session.user.registration_number = token.registration_number as string | undefined;
        session.user.position = token.position as string | undefined;
        session.user.issupervisor = token.issupervisor as boolean | undefined;
        session.user.superviseur = token.superviseur as string | undefined;
      }
      //console.log("session: ", session)
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;