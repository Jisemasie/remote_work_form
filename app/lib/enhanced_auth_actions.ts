'use server'

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { executeDataRequest, executeInsertUpdateRequest } from './db';
import { InputParam } from './definitions';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';

// Enhanced authentication with security features
export async function authenticateWithSecurity(
    prevState: string | undefined,
    formData: FormData,
) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
        // Check if account is locked
        const lockStatus = await checkAccountLockStatus(username);
        if (lockStatus.isLocked) {
            return `Compte verrouillé. Raison: ${lockStatus.reason}. Contactez l'administrateur.`;
        }

        // Attempt authentication
        await signIn('credentials', formData);

        // Reset failed attempts on successful login
        await resetFailedLoginAttempts(username);

        // Update last login
        const userResult = await executeDataRequest(
            'SELECT id FROM users WHERE username = @username',
            [{ key: 'username', value: username }],
            false
        );

        if (userResult && userResult.length > 0) {
            await updateUserLastLogin(userResult[0].id);
        }

    } catch (error) {
        if (error instanceof AuthError) {
            // Increment failed login attempts
            const failedAttempts = await incrementFailedLoginAttempts(username);

            switch (error.type) {
                case 'CredentialsSignin':
                    if (failedAttempts >= 5) {
                        return 'Compte verrouillé après 5 tentatives échouées. Contactez l\'administrateur.';
                    }
                    return `Identifiants invalides. Tentatives restantes: ${5 - failedAttempts}`;
                default:
                    return 'Une erreur est survenue lors de la connexion.';
            }
        }
        throw error;
    }
}

// Check if account is locked
export async function checkAccountLockStatus(username: string) {
    try {
        const params: InputParam[] = [
            { key: 'username', value: username }
        ];

        const result = await executeDataRequest('sp_CheckAccountLockStatus', params, true);

        if (result && result.length > 0) {
            return {
                isLocked: result[0].is_locked,
                reason: result[0].lock_reason,
                lockedAt: result[0].locked_at,
                lockedBy: result[0].locked_by
            };
        }

        return { isLocked: false, reason: null, lockedAt: null, lockedBy: null };
    } catch (error) {
        console.error('Erreur lors de la vérification du verrouillage:', error);
        return { isLocked: false, reason: null, lockedAt: null, lockedBy: null };
    }
}

// Enhanced password change with history tracking
export async function changeUserPasswordEnhanced(
    userId: number,
    currentPassword: string,
    newPassword: string
) {
    try {
        // Validate password strength
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
            return {
                success: false,
                message: passwordValidation.message
            };
        }

        // Check password history (prevent reuse of last 5 passwords)
        const isPasswordReused = await checkPasswordHistory(userId, newPassword);
        if (isPasswordReused) {
            return {
                success: false,
                message: 'Vous ne pouvez pas réutiliser un de vos 5 derniers mots de passe'
            };
        }

        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'current_password', value: currentPassword },
            { key: 'new_password', value: await bcrypt.hash(newPassword, 12) }
        ];

        const result = await executeInsertUpdateRequest('sp_ChangeUserPasswordEnhanced', params, true);

        if (result && result.length > 0) {
            const response = result[0];
            if (response.success) {
                await logUserActivity(userId, 'PASSWORD_CHANGED', 'User changed password successfully');
                revalidatePath('/main/profile');
                return { success: true, message: 'Mot de passe modifié avec succès' };
            } else {
                return { success: false, message: response.message || 'Erreur lors du changement de mot de passe' };
            }
        }

        return { success: false, message: 'Erreur lors du changement de mot de passe' };
    } catch (error) {
        console.error('Erreur lors du changement de mot de passe:', error);
        return { success: false, message: 'Erreur système lors du changement de mot de passe' };
    }
}

// Enhanced password strength validation
function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNoSpaces = !/\s/.test(password);

    if (password.length < minLength) {
        return { isValid: false, message: `Le mot de passe doit contenir au moins ${minLength} caractères` };
    }

    if (!hasUpperCase) {
        return { isValid: false, message: 'Le mot de passe doit contenir au moins une majuscule' };
    }

    if (!hasLowerCase) {
        return { isValid: false, message: 'Le mot de passe doit contenir au moins une minuscule' };
    }

    if (!hasNumbers) {
        return { isValid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
    }

    if (!hasSpecialChar) {
        return { isValid: false, message: 'Le mot de passe doit contenir au moins un caractère spécial' };
    }

    if (!hasNoSpaces) {
        return { isValid: false, message: 'Le mot de passe ne doit pas contenir d\'espaces' };
    }

    return { isValid: true, message: 'Mot de passe valide' };
}

// Check password history
async function checkPasswordHistory(userId: number, newPassword: string): Promise<boolean> {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId }
        ];

        const result = await executeDataRequest('sp_GetPasswordHistory', params, true);

        if (result && result.length > 0) {
            for (const historyEntry of result) {
                const isMatch = await bcrypt.compare(newPassword, historyEntry.password_hash);
                if (isMatch) {
                    return true;
                }
            }
        }

        return false;
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'historique des mots de passe:', error);
        return false;
    }
}

// Enhanced user activity logging
export async function logUserActivity(
    userId: number,
    action: string,
    description: string,
    entityType?: string,
    entityId?: number,
    oldValues: any = null,
    newValues: any = null
) {
    try {
        const headersList = headers();
        const ipAddress = headersList.get('x-forwarded-for') ||
            headersList.get('x-real-ip') ||
            'unknown';
        const userAgent = headersList.get('user-agent') || 'unknown';

        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'action', value: action },
            { key: 'description', value: description },
            { key: 'entity_type', value: entityType },
            { key: 'entity_id', value: entityId },
            { key: 'old_values', value: oldValues ? JSON.stringify(oldValues) : null },
            { key: 'new_values', value: newValues ? JSON.stringify(newValues) : null },
            { key: 'ip_address', value: ipAddress },
            { key: 'user_agent', value: userAgent }
        ];

        await executeInsertUpdateRequest('sp_LogUserActivity', params, true);
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'activité:', error);
    }
}

// Update user last login with enhanced tracking
export async function updateUserLastLogin(userId: number) {
    try {
        const headersList = headers();
        const ipAddress = headersList.get('x-forwarded-for') ||
            headersList.get('x-real-ip') ||
            'unknown';

        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'last_login', value: new Date() },
            { key: 'ip_address', value: ipAddress }
        ];

        await executeInsertUpdateRequest('sp_UpdateUserLastLogin', params, true);

        // Log the login activity
        await logUserActivity(userId, 'LOGIN', 'User logged in successfully');
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la dernière connexion:', error);
    }
}

// Track failed login attempts with enhanced security
export async function incrementFailedLoginAttempts(username: string): Promise<number> {
    try {
        const params: InputParam[] = [
            { key: 'username', value: username }
        ];

        const result = await executeInsertUpdateRequest('sp_IncrementFailedLoginAttempts', params, true);
        const failedAttempts = result && result.length > 0 ? result[0].failed_attempts : 0;

        // Auto-lock account after 5 failed attempts
        if (failedAttempts >= 5) {
            await lockUserAccount(username, 'Too many failed login attempts');
        }

        return failedAttempts;
    } catch (error) {
        console.error('Erreur lors de l\'incrémentation des tentatives échouées:', error);
        return 0;
    }
}

// Reset failed login attempts
export async function resetFailedLoginAttempts(username: string) {
    try {
        const params: InputParam[] = [
            { key: 'username', value: username }
        ];

        await executeInsertUpdateRequest('sp_ResetFailedLoginAttempts', params, true);
    } catch (error) {
        console.error('Erreur lors de la réinitialisation des tentatives échouées:', error);
    }
}

// Lock user account
export async function lockUserAccount(username: string, reason: string = 'Multiple failed login attempts') {
    try {
        const params: InputParam[] = [
            { key: 'username', value: username },
            { key: 'reason', value: reason }
        ];

        await executeInsertUpdateRequest('sp_LockUserAccount', params, true);

        // Get user ID for logging
        const userResult = await executeDataRequest(
            'SELECT id FROM users WHERE username = @username',
            [{ key: 'username', value: username }],
            false
        );

        if (userResult && userResult.length > 0) {
            await logUserActivity(
                userResult[0].id,
                'ACCOUNT_LOCKED',
                `Account locked: ${reason}`
            );
        }
    } catch (error) {
        console.error('Erreur lors du verrouillage du compte:', error);
    }
}

// Unlock user account
export async function unlockUserAccount(username: string, adminId: number) {
    try {
        const params: InputParam[] = [
            { key: 'username', value: username }
        ];

        await executeInsertUpdateRequest('sp_UnlockUserAccount', params, true);

        // Get user ID for logging
        const userResult = await executeDataRequest(
            'SELECT id FROM users WHERE username = @username',
            [{ key: 'username', value: username }],
            false
        );

        if (userResult && userResult.length > 0) {
            await logUserActivity(
                adminId,
                'ACCOUNT_UNLOCKED',
                `Account unlocked for user: ${username}`
            );
        }

        revalidatePath('/main/users');
    } catch (error) {
        console.error('Erreur lors du déverrouillage du compte:', error);
    }
}

// Enhanced sign out with activity logging
export async function signOutUserEnhanced(userId?: number) {
    try {
        if (userId) {
            await logUserActivity(userId, 'LOGOUT', 'User logged out');
        }

        await signOut({
            redirect: true,
            redirectTo: "/login",
        });
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        throw error;
    }
}

// Get user permissions with caching
export async function getUserPermissions(userId: number) {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId }
        ];

        const result = await executeDataRequest('sp_GetUserPermissions', params, true);
        return result || [];
    } catch (error) {
        console.error('Erreur lors de la récupération des permissions:', error);
        return [];
    }
}

// Check user permission with role-based access
export async function checkUserPermission(
    userId: number,
    resource: string,
    action: string
): Promise<boolean> {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'resource', value: resource },
            { key: 'action', value: action }
        ];

        const result = await executeDataRequest('sp_CheckUserPermission', params, true);
        return result && result.length > 0 ? result[0].has_permission : false;
    } catch (error) {
        console.error('Erreur lors de la vérification des permissions:', error);
        return false;
    }
}

// Get user activity logs
export async function getUserActivityLogs(userId: number, limit: number = 50) {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId },
            { key: 'limit', value: limit }
        ];

        const result = await executeDataRequest('sp_GetUserActivityLogs', params, true);
        return result || [];
    } catch (error) {
        console.error('Erreur lors de la récupération des logs d\'activité:', error);
        return [];
    }
}

// Force password change
export async function forcePasswordChange(userId: number, adminId: number) {
    try {
        const params: InputParam[] = [
            { key: 'user_id', value: userId }
        ];

        await executeInsertUpdateRequest('sp_ForcePasswordChange', params, true);
        await logUserActivity(adminId, 'FORCE_PASSWORD_CHANGE', `Forced password change for user ID: ${userId}`);
        revalidatePath('/main/users');
    } catch (error) {
        console.error('Erreur lors du forçage du changement de mot de passe:', error);
    }
}

// Session management
export async function validateSession(sessionToken: string) {
    try {
        const params: InputParam[] = [
            { key: 'session_token', value: sessionToken }
        ];

        const result = await executeDataRequest('sp_ValidateSession', params, true);
        return result && result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Erreur lors de la validation de session:', error);
        return null;
    }
}

// Clean expired sessions
export async function cleanExpiredSessions() {
    try {
        await executeInsertUpdateRequest('sp_CleanExpiredSessions', [], true);
    } catch (error) {
        console.error('Erreur lors du nettoyage des sessions expirées:', error);
    }
}