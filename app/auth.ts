@@ .. @@
             const result: ADAuthResponse = await fetchData(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ad_auth`, 'POST', body)
             if(result && result.authenticated ){

               // Convert to NextAuth User type
               const user: User = {
-                id: dbUser.id_user?.toString() ?? '', // Convert number to string
+                id: dbUser.id_user?.toString() ?? '', // Convert number to string
                 name: dbUser.fullname ?? '',
                 fullName: dbUser.fullname ?? '',
                 username: dbUser.username ?? '',
                 email: dbUser.email ?? '',
                 profileName: dbUser.profile_name ?? '',
-                profileId: dbUser.profileid,    
-                orgId: dbUser.id_organisation ?? 0,
+                profileId: dbUser.profileid,    
+                orgId: dbUser.id_organisation ?? 0,
                 orgName: dbUser.nom_organisation ?? '',
-                schoolId: dbUser.id_ecole ?? 0,
+                schoolId: dbUser.id_ecole ?? 0,
                 accessLevel: dbUser.access_level ?? '',
                 sessionId: uuidv4(), // Generate a new session ID
                 registration_number: dbUser.registration_number ?? '',
                 position: dbUser.position ?? '',
                 issupervisor: dbUser.issupervisor ?? false,
                 superviseur: dbUser.superviseur ?? '',
-                branch: dbUser.branch ?? '',
+                branch: dbUser.nom_organisation ?? '', // Use organisation name as branch
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