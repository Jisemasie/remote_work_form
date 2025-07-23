import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from 'ldap-authentication';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body;

  try {
    const user = await authenticate({
      ldapOpts: {
        url: "ldap://fincaint.local", 
        //reconnect: true,
      } ,
      userDn: `fincaint\\${username}`, 
      userPassword: password,
      userSearchBase: "dc=fincaint,dc=local",
      usernameAttribute: "sAMAccountName",
      username, 
    });
    const { cn, title } = user;
    return NextResponse.json({ authenticated: true, cn: cn, title: title, error: ""});
  } catch (error) {
    if(error instanceof Error){
    console.error("LDAP auth error:", error);
    return NextResponse.json({ authenticated: false, cn: "", title: "", error: "LDAP auth error" }, { status: 401 });
    }
  }
}
