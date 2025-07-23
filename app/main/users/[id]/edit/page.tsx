// app/page/users/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams, usePathname } from 'next/navigation';
import { FaSave, FaTimes, FaArrowLeft } from 'react-icons/fa';
import { searchUser, createorUpdateUser, getUserProfileList, getBranchList } from '@/app/lib/user_actions';
import { CreateUpdateUser, SelectList, CreateUpdateResult } from '@/app/lib/definitions';
import React from 'react';
import SelectWrapper from '@/app/ui/select_list';
import Spinner from '@/app/ui/spinner';
import { BeatLoader } from 'react-spinners';
import { useToast } from '@/app/hook/useToast';
import { checkSession } from '@/app/lib/utils';
import { useRef } from 'react';

export default function UserEdit() {

  const { success, error } = useToast();
  const pwdConfRef = useRef<HTMLInputElement>(null);
  const params = useParams()
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [profileList, setProfileList] = useState<SelectList[] | null>([]);
  const [branchList, setBranchList] = useState<SelectList[] | null>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [formData, setFormData] = useState<CreateUpdateUser>({
    id: 0,
    username: '',
    fullname: '',
    phone: '',
    status: 'A',
    password: '',
    auth_type: 'ad',
    id_user_profile: 0,
    email: '',
    locked: 0,
    version: '',
    created_by: 0,
    use_mfa: 0,
    branch: '',
    access_level: 'branch',
    user_must_change_pwd: 1,
    create_dt: new Date(),
    expiry_date: new Date(),
    registration_number: '',
    position: '',
    superviseur: '',
    issupervisor: 0
  });

  // Get action and user ID from URL
  const action = searchParams.get('action') || 'add';

  //get the param id
  const { id } = params

  //check session
  useEffect(() => {

    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}${pathname}`;
      checkSession(`/login?callbackUrl=${fullUrl}`);
    }

  }, [pathname]);

  useEffect(() => {
    
    const loadUserData = async () => {
      try {
        if (action === 'update' && id !== '0') {
      
              const i_params = {
                  scope: "userid",
                  value: String(id)
              };
            const user = await searchUser(i_params);
            console.log("User: ", user)
            if (user) {
              user[0].password = '';
              setFormData(user[0]);
            }
        }

        //profile list
        const profileList = await getUserProfileList()
        console.log("profileList: ", profileList)
        setProfileList(profileList);

        //branch list
        const branchList = await getBranchList()
        console.log("branchList: ", branchList)
        setBranchList(branchList);

        //get userId from session storage
        const userId = sessionStorage.getItem("userId");
        setCurrentUserId(String(userId));
        setFormData(prevState => ({
          ...prevState,
          created_by: Number(userId)
        }));


      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [action, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
   
    setFormData(prev => {
      if (type === 'checkbox') {
        return { ...prev, [name]: (e.target as HTMLInputElement).checked ? 1 : 0 };
      }
      else if (type === 'datetime-local') {
        // Convert to ISO string (UTC) before saving
        return { ...prev, [name]: new Date(value).toISOString() };
      }
      else {
        return { ...prev, [name]: value };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    //const id = loading("Enregistrement de l'utilisateur...");
    setIsSaving(true);

    //check if password and confirm password match
    if (pwdConfRef.current) {
      const value = pwdConfRef.current.value;
      console.log('Input value:', value);

      if(value != formData.password){
        error('Mot de passe et confirmation ne matchent pas!');
        setIsSaving(false);
        return;
      }
    }

    try {
      console.log("Creating or updating with form data: ", formData);
      if (action === 'update') {
        const result = await createorUpdateUser(formData);
        if(result){
          success('Enregistré avec succès!');
          //update version
          setFormData(prevState => ({
            ...prevState,
            version: (result[0] as CreateUpdateResult).version
          }));
        }
        else {
          error("Erreur lors de l'enregistrement");
        }
      } else {
        const result = await createorUpdateUser(formData);
        if(result){
          success('Enregistré avec succès!');
          router.replace(`/main/users/${(result[0] as CreateUpdateResult).id}/edit?action=update`)
        }
        else {
          error("Erreur lors de l'enregistrement");
        }
      }
    } catch (err) {
      console.error('Error saving user:', err);
      error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/main/users');
  };

  const handleReturn = () => {
    router.push('/main/users');
  };

  if (isLoading) {
    return <Spinner />;
  }  

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handleReturn}
              className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              <FaArrowLeft className="mr-2" />
              Retour à la liste
            </button>
            <h1 className="text-2xl font-bold">
              {action === 'update' ? 'Modifier Utilisateur' : 'Ajouter Nouvel Utilisateur'}
            </h1>
            <div className="w-24"></div> {/* Spacer for alignment */}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Username */}
              <div className="space-y-1">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Identifiant *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={String(formData.username)}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label htmlFor="fullname" className="block text-sm font-medium text-gray-700">
                  Nom Complet *
                </label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              {/* auth type */}
              <div className="space-y-1">
                <label htmlFor="auth_type" className="block text-sm font-medium text-gray-700">
                  Type Authentification *
                </label>
                <select
                  id="auth_type"
                  name="auth_type"
                  value={String(formData.auth_type)}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="local" disabled>Local</option>
                  <option value="ad">Active Directory</option>
                </select>
              </div>

              {/* access level */}
              <div className="space-y-1">
                <label htmlFor="access_level" className="block text-sm font-medium text-gray-700">
                  Niveau d&apos;access *
                </label>
                <select
                  id="access_level"
                  name="access_level"
                  value={String(formData.access_level)}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="branch">Branche</option>
                  <option value="all">Tout</option>
                </select>
              </div>

              {/*  id */}
              <input type='hidden' name='id' id='id' value={String(formData.id)}/>

              {/* version*/}
              <input type='hidden' name='version' id='version' value={formData.version}/>

               {/* created_by */}
              <input type='hidden' name='created_by' id='created_by' value={currentUserId}/>

              {/* user profile */}
              <SelectWrapper
                label="Branche"
                name="branch"
                isDisabled={false}
                value={String(formData.branch)}
                options={branchList}
                onChange={handleChange}
              />

              {/* user profile */}
              <SelectWrapper
                label="Profil"
                name="id_user_profile"
                isDisabled={false}
                value={String(formData.id_user_profile)}
                options={profileList}
                onChange={handleChange}
              />

              {/* email */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse Mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={String(formData.email)}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={String(formData.phone)}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Statut *
                </label>
                <select
                  id="status"
                  name="status"
                  value={String(formData.status)}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="A">Actif</option>
                  <option value="I">Inactif</option>
                </select>
              </div>


              {/* Locked */}
              <div className="space-y-1">
                <label htmlFor="locked" className="block text-sm font-medium text-gray-700">
                  Verrouillé *
                </label>
                <div className="flex items-center border border-gray-300 rounded-md p-3">
                  <input
                    id="locked"
                    name="locked"
                    type="checkbox"
                    checked={formData.locked === 1}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>

              {/* registration_number */}
              <div className="space-y-1">
                <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700">
                  Numéro d&apos;enregistrement
                </label>
                <input
                  type="text"
                  id="registration_number"
                  name="registration_number"
                  value={String(formData.registration_number)}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              {/* position */}
              <div className="space-y-1">
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                  Position
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={String(formData.position)}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              {/* superviseur */}
              <div className="space-y-1">
                <label htmlFor="superviseur" className="block text-sm font-medium text-gray-700">
                  Superviseur
                </label>
                <input
                  type="text"
                  id="superviseur"
                  name="superviseur"
                  value={String(formData.superviseur)}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              {/* issupervisor */}
              <div className="space-y-1">
                <label htmlFor="issupervisor" className="block text-sm font-medium text-gray-700">
                  Est t&apos; il superviseur
                </label>
                <select
                  id="issupervisor"
                  name="issupervisor"
                  value={String(formData.issupervisor)}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="0">Non</option>
                  <option value="1">Oui</option>
                </select>
              </div>

              {/* use_mfa */}
              <div className="space-y-1">
                <label htmlFor="use_mfa" className="block text-sm font-medium text-gray-700">
                    Activer l&apos;authentification multi-facteurs
                </label>
                <select
                  id="use_mfa"
                  name="use_mfa"
                  value={String(formData.use_mfa)}
                  onChange={handleChange}
                  required
                  className="input"
                >
                  <option value="0">Non</option>
                  <option value="1">Oui</option>
                </select>
              </div>

              {/* create date */}
              <div className="space-y-1">
                <label htmlFor="create_dt" className="block text-sm font-medium text-gray-700">
                  Date de création *
                </label>
                <input
                  type="datetime-local"
                  id="create_dt"
                  name="create_dt"
                  value={formData.create_dt ? new Date(formData.create_dt).toISOString().slice(0, 16) :''}
                  onChange={handleChange}
                  disabled
                  className="input"
                />
              </div>

              {/* Expiry date */}
              <div className="space-y-1">
                <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700">
                  Date d&apos;expiration
                </label>
                <input
                  type="datetime-local"
                  id="expiry_date"
                  name="expiry_date"
                  value={formData.expiry_date ? new Date(formData.expiry_date).toISOString().slice(0, 16) :''}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  disabled={formData.auth_type == "ad" ? true : false}
                  value={String(formData.password)}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Confirmer Mot de passe
                </label>
                <input
                  disabled={formData.auth_type == "ad" ? true : false}
                  type="password"
                  ref={pwdConfRef}
                  className="input"
                />
              </div>
              
            </div>

            {/* Bottom button */}

            <div className="mt-8 flex justify-end space-x-4">

              <button
                type="button"
                onClick={handleCancel}
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaTimes className="mr-2" />
                Annuler
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSave className="mr-2" />
                {isSaving ? <BeatLoader size={6} color="#fff" /> : 'Enregistrer'}
              </button>

            </div>
          
          </form>

        </div>
      </div>
    </main>
  );
}