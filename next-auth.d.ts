import "next-auth";
import { DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    fullName?: string;
    username?: string;
    lastLogin?: string;
    profileName?: string;
    profileId?: number;
    branch?: number;
    branchName?: string;
    accessLevel?: string;
    sessionId?: string; 
    registration_number?: string;
    position?: string;
    issupervisor?: boolean;
    superviseur?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
      fullName?: string;
      username?: string;
      lastLogin?: string;
      profileName?: string;
      profileId?: number;
      branch?: number;
      branchName?: string;
      accessLevel?: string;
      sessionId?: string;
      registration_number?: string;
      position?: string;
      issupervisor?: boolean;
      superviseur?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    fullName?: string;
    username?: string;
    lastLogin?: string;
    branch?: number;
    branchName?: string;
    profileName?: string;
    profileId?: number;
    accessLevel?: string;
    sessionId?: string;
    registration_number?: string;
    position?: string;
    issupervisor?: boolean;
    superviseur?: string;
  }
}