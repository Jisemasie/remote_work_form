'use server'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export async function getSessionData() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }
  const userData = session.user;
  return userData;
}