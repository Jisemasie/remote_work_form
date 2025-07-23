"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getUserLoginDetails } from '@/app/lib/user_actions'
import { useActionState } from 'react';
import { authenticate } from '@/app/lib/auth_action';
import { useTransition } from 'react';
import { LoginData } from "../lib/definitions";

const Login = () => {

  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/main';


  console.log("Getting callback: ", callbackUrl)

  const [errorMessage, formAction] = useActionState(
    authenticate,
    undefined,
  );

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");

    try {
      //Get user details
      console.log("getting user details")
      const userLoginData = await getUserLoginDetails(formData.username);
      console.log("userLoginData", userLoginData)
      const dt = Date.now()
      if (userLoginData) {
        const userData = {
          group: String((userLoginData as LoginData).profile_name),
          userId: String((userLoginData as LoginData).id),
          username: String((userLoginData as LoginData).username),
          fullname: String((userLoginData as LoginData).fullname),
          last_login_date: String(dt)
        };

        Object.entries(userData).forEach(([key, value]) => {
          sessionStorage.setItem(key, value);
        });

        console.log("Before authenticate user!", event.currentTarget)
        //authenticate user

        data.append("redirect", "true")
        data.append("redirectTo", String(callbackUrl))
        startTransition(() => {
          formAction(data);
        });
        setError("Error: ")

      } else {
        setError("Erreur de connexion")
        console.log("user inexistant!")
      }
    } catch (error) {
      console.error("Login error:", error, String(errorMessage));
      setError(String(errorMessage));
    }
  };

// Register service worker for PWA functionality
  useEffect(() => {

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration.scope);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-1">
      <div className="fixed inset-0 bg-black/30 -z-10" />
      <div
        className="fixed inset-0 bg-cover bg-center -z-20"
        // style={{ backgroundImage: "url('/classroom-desk.jpg')" }}
      />

      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header with logo */}
        <div className="bg-blue-100 p-6 flex justify-center">
          <div className="relative w-24 h-24 rounded-full bg-white p-1 shadow-md overflow-hidden">
            <Image
              src="/app_logo.png"
              fill
              className="object-contain rounded-full"
              alt="finca logo"
              priority
            />
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          <h1 className="text-2xl font-bold text-center text-gray-800">Connexion</h1>

          {(error && !isPending) && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}{errorMessage == undefined ? '' : errorMessage}
            </div>
          )}

          {/* Username field with floating label */}
          <div className="relative w-full">
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              className="peer w-full px-4 pt-5 pb-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder=" " // <-- espace pour activer le floating label sans texte visible
            />
            <label
              htmlFor="username"
              className="absolute left-3 top-2 text-gray-500 text-sm transition-all
                peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600
                pointer-events-none"
            >
              Nom d&apos;utilisateur
            </label>
          </div>

          {/* Password field with toggle and floating label */}
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={4}
              maxLength={50}
              autoComplete="current-password"
              className="peer w-full px-4 pt-5 pb-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 text-black"
              placeholder=" "
            />
            <label
              htmlFor="password"
              className="absolute left-3 top-2 text-gray-500 text-sm transition-all
                peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
                peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600
                pointer-events-none"
            >
              Mot de passe
            </label>
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex justify-end">
            <Link
              href="/page/users/password/reset"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isPending}
            className={`cursor-pointer w-full py-3 px-4 rounded-lg font-medium text-white transition ${
              isPending ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isPending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connexion...
              </span>
            ) : 'Se connecter'}
          </button>
        </form>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Admin App. Tous droits réservés.
        </div>
      </div>
    </div>
  );
};

export default Login;
