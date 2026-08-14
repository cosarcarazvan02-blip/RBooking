"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  User,
  Hotel,
  Check,
  AlertCircle,
  KeyRound,
  Smartphone,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import { getActiveApiKey } from "@/lib/apiKey";
import { translateApiError } from "@/lib/translateApiError";
import { useLanguage } from "@/context/LanguageContext";

interface LoginUserData {
  id?: string;
  Id?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  Role?: string;
}

export default function LoginForm() {
  const { lang } = useLanguage();
  const router = useRouter();

  // Mode: standard password login vs recovery code login (when phone is unavailable)
  const [authMethod, setAuthMethod] = useState<"password" | "recovery_code">("password");

  // Two-factor challenge mode (if login triggered 2FA challenge)
  const [twoFactorChallenge, setTwoFactorChallenge] = useState(false);
  const [twoFactorTab, setTwoFactorTab] = useState<"totp" | "recovery">("totp");
  const [totpCode, setTotpCode] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Field validation states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [recoveryCodeError, setRecoveryCodeError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; recoveryCode?: boolean }>({});

  // Global form states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateEmail = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) {
      return lang === "RO" ? "Adresa de email este obligatorie." : "Email address is required.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return lang === "RO"
        ? "Introduceți o adresă de email validă (ex: utilizator@exemplu.com)."
        : "Enter a valid email address (e.g. user@example.com).";
    }
    return null;
  };

  const validatePassword = (val: string): string | null => {
    if (!val) {
      return lang === "RO" ? "Parola este obligatorie." : "Password is required.";
    }
    if (val.length < 6) {
      return lang === "RO"
        ? "Parola trebuie să aibă cel puțin 6 caractere."
        : "Password must be at least 6 characters.";
    }
    return null;
  };

  const validateRecoveryCode = (val: string): string | null => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, "");
    if (!clean) {
      return lang === "RO" ? "Codul de recuperare este obligatoriu." : "Recovery code is required.";
    }
    if (clean.length < 6) {
      return lang === "RO"
        ? "Codul de recuperare trebuie să aibă cel puțin 6 caractere (ex: 7K2M-9P4X)."
        : "Recovery code must be at least 6 characters (e.g. 7K2M-9P4X).";
    }
    return null;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (touched.email) {
      setEmailError(validateEmail(val));
    }
    setErrorMessage(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      setPasswordError(validatePassword(val));
    }
    setErrorMessage(null);
  };

  const handleRecoveryCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setRecoveryCode(val);
    if (touched.recoveryCode) {
      setRecoveryCodeError(validateRecoveryCode(val));
    }
    setErrorMessage(null);
  };

  const handleBlur = (field: "email" | "password" | "recoveryCode") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "email") {
      setEmailError(validateEmail(email));
    } else if (field === "password") {
      setPasswordError(validatePassword(password));
    } else if (field === "recoveryCode") {
      setRecoveryCodeError(validateRecoveryCode(recoveryCode));
    }
  };

  const selectQuickRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("Parola123!");
    setEmailError(null);
    setPasswordError(null);
    setRecoveryCodeError(null);
    setErrorMessage(null);
  };

  const saveAuthSession = (token: string, userObj: LoginUserData, roleFallback: string, warningMessage?: string | null) => {
    const profileToSave = {
      id: userObj.id || userObj.Id || "user-id",
      name: `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || email.split("@")[0],
      email: email.trim(),
      phone: "+40 700 000 000",
      role: String(userObj.role || userObj.Role || roleFallback || "User"),
    };

    localStorage.setItem("authToken", token);
    localStorage.setItem("rbooking_token", token);
    localStorage.setItem("currentUser", JSON.stringify(userObj));
    localStorage.setItem("rbooking_user_profile", JSON.stringify(profileToSave));
    localStorage.setItem("rbooking_logged_in", "true");
    window.dispatchEvent(new Event("auth-state-change"));
    window.dispatchEvent(new Event("rbooking_auth_change"));
    window.dispatchEvent(new Event("storage"));

    const baseMsg = lang === "RO"
      ? `Acces autorizat — Bun venit, ${userObj.firstName || "Utilizator"}`
      : `Access authorized — Welcome, ${userObj.firstName || "User"}`;

    setSuccessMessage(warningMessage ? `${baseMsg} (${warningMessage})` : baseMsg);

    setTimeout(() => {
      const r = String(profileToSave.role || "").toLowerCase();
      if (r === "operator" || r === "manager") {
        router.push("/manager/accommodation");
      } else {
        router.push("/");
      }
    }, 1200);
  };

  // 1. Autentificare standard cu Parola (sau cu 2FA challenge)
  const handlePasswordLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    setEmailError(emailValidation);
    setPasswordError(passwordValidation);
    setTouched({ email: true, password: true });

    if (emailValidation || passwordValidation) {
      setErrorMessage(
        lang === "RO"
          ? "Vă rugăm să corectați erorile din formular înainte de a continua."
          : "Please correct the form errors before continuing."
      );
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = "http://localhost:5293/api";
      const apiKey = getActiveApiKey();

      // Al doilea pas al login-ului (cand contul are 2FA activ) retrimite acest request
      // cu twoFactorCode completat, pe langa email + parola deja validate.
      const requestBody: Record<string, string> = { email: email.trim(), password };
      if (twoFactorChallenge && totpCode.trim()) {
        requestBody.twoFactorCode = totpCode.trim();
      }

      const response = await fetch(`${apiUrl}/Auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();

        // Verificăm dacă backend-ul solicită autentificare 2FA
        if (data.requiresTwoFactor) {
          setTwoFactorChallenge(true);
          setErrorMessage(null);
          setSuccessMessage(
            lang === "RO"
              ? "Autentificarea în 2 pași este activă. Introduceți codul TOTP sau folosiți un Cod de Recuperare."
              : "Two-Factor Auth is active. Enter TOTP code or use a Recovery Code."
          );
          setIsLoading(false);
          return;
        }

        saveAuthSession(data.token, data.user || {}, "User", data.warningMessage);
      } else {
        const errorData = await response.json().catch(() => null);
        const serverError =
          translateApiError(errorData?.message, lang) ||
          (lang === "RO" ? "Email sau parolă incorectă." : "Invalid email or password.");

        // Odată intrat în pasul 2FA, un cod greșit NU trebuie să cadă pe fallback-ul
        // demo/offline de mai jos - altfel am ocoli complet autentificarea în doi pași.
        if (twoFactorChallenge) {
          setErrorMessage(serverError);
          return;
        }

        // Demo fallback
        const isDemo =
          email.includes("@booking.com") ||
          email.includes("@hotel.com") ||
          email.includes("@rbooking.com");
        if (isDemo) {
          let detectedRole = "User";
          if (email.toLowerCase().includes("admin")) detectedRole = "Admin";
          else if (
            email.toLowerCase().includes("operator") ||
            email.toLowerCase().includes("manager")
          )
            detectedRole = "Manager";

          const mockUser = {
            id: "demo-user-id",
            name: email.split("@")[0] || "User",
            firstName: email.split("@")[0] || "User",
            lastName: "Demo",
            email: email.trim(),
            role: detectedRole,
          };

          saveAuthSession("demo-token", mockUser, detectedRole);
        } else {
          setErrorMessage(serverError);
        }
      }
    } catch {
      // La fel ca mai sus - in pasul 2FA nu oferim un fallback offline care ar ocoli codul.
      if (twoFactorChallenge) {
        setErrorMessage(lang === "RO" ? "Eroare de conexiune la server." : "Connection error.");
        return;
      }

      let detectedRole = "User";
      if (email.toLowerCase().includes("admin")) detectedRole = "Admin";
      else if (
        email.toLowerCase().includes("operator") ||
        email.toLowerCase().includes("manager")
      )
        detectedRole = "Manager";

      const mockUser = {
        id: "offline-user-id",
        name: email.split("@")[0] || "User",
        firstName: email.split("@")[0] || "User",
        lastName: "Local",
        email: email.trim(),
        role: detectedRole,
      };

      saveAuthSession("offline-token", mockUser, detectedRole);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Autentificare cu Cod de Recuperare (Emergency Recovery Login)
  const handleRecoveryCodeLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailValidation = validateEmail(email);
    const codeValidation = validateRecoveryCode(recoveryCode);

    setEmailError(emailValidation);
    setRecoveryCodeError(codeValidation);
    setTouched((prev) => ({ ...prev, email: true, recoveryCode: true }));

    if (emailValidation || codeValidation) {
      setErrorMessage(
        lang === "RO"
          ? "Vă rugăm să introduceți adresa de email și un cod de recuperare valid."
          : "Please enter your email and a valid recovery code."
      );
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = "http://localhost:5293/api";
      const apiKey = getActiveApiKey();

      const response = await fetch(`${apiUrl}/Auth/recovery-codes/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
          email: email.trim(),
          code: recoveryCode.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const userObj = data.user || {};
        const warning = data.warningMessage || (data.remainingCodes <= 2
          ? (lang === "RO"
              ? `Mai aveți ${data.remainingCodes} coduri de recuperare rămase.`
              : `${data.remainingCodes} recovery codes remaining.`)
          : null);

        saveAuthSession(data.token, userObj, userObj.role || "User", warning);
      } else {
        const errData = await response.json().catch(() => null);
        const serverError =
          errData?.message ||
          (lang === "RO"
            ? "Codul de recuperare este invalid sau a fost deja utilizat."
            : "Recovery code is invalid or has already been used.");

        setErrorMessage(serverError);
      }
    } catch {
      setErrorMessage(lang === "RO" ? "Eroare de conexiune la server." : "Connection error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Brand Badge */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block group">
          <div className="text-xs font-mono font-semibold tracking-[0.25em] uppercase text-neutral-500 dark:text-neutral-400 mb-2">
            [ RBooking Platform ]
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-neutral-900 dark:text-neutral-50 tracking-tight">
            {authMethod === "recovery_code"
              ? (lang === "RO" ? "Autentificare de Urgență" : "Emergency Recovery Login")
              : (lang === "RO" ? "Autentificare Cont" : "Account Login")}
          </h1>
        </Link>
      </div>

      <div className="bg-white dark:bg-[#131519] border border-neutral-300 dark:border-neutral-800 p-8 sm:p-10 shadow-sm space-y-6">
        {/* Auth Method Mode Badge */}
        {authMethod === "recovery_code" ? (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300 font-mono text-xs">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                {lang === "RO"
                  ? "Mod Recuperare: Când nu ai telefonul la îndemână"
                  : "Recovery Mode: When phone is not handy"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("password");
                setErrorMessage(null);
              }}
              className="text-[11px] underline uppercase tracking-wider cursor-pointer hover:opacity-80 shrink-0"
            >
              {lang === "RO" ? "Parolă →" : "Password →"}
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-center text-xs font-mono pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <span className="text-neutral-500">
              {lang === "RO" ? "Metodă:" : "Method:"} <strong className="text-neutral-900 dark:text-white font-semibold">{lang === "RO" ? "Email & Parolă" : "Email & Password"}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("recovery_code");
                setErrorMessage(null);
              }}
              className="text-amber-700 dark:text-amber-300 hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{lang === "RO" ? "Cod Recuperare (2FA)" : "Recovery Code (2FA)"}</span>
            </button>
          </div>
        )}

        {/* Global Status Alerts */}
        {errorMessage && (
          <div className="p-4 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200 text-xs flex items-center gap-3 border border-red-300 dark:border-red-800 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span className="font-mono">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 text-xs flex items-center gap-3 border border-emerald-300 dark:border-emerald-800 rounded-xl">
            <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-mono">{successMessage}</span>
          </div>
        )}

        {/* 2FA Challenge Prompt if backend required 2FA during standard login */}
        {twoFactorChallenge ? (
          <div className="space-y-5 pt-2">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-blue-900 dark:text-blue-300">
                <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{lang === "RO" ? "Autentificare în Doi Pași (2FA)" : "Two-Factor Verification (2FA)"}</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {lang === "RO"
                  ? "Introduceți codul generat de aplicația de autentificare (TOTP) sau folosiți un Cod de Recuperare salvat."
                  : "Enter the code generated by your authenticator app (TOTP) or use a saved Recovery Code."}
              </p>
            </div>

            {/* Switch between TOTP and Recovery Code in 2FA Challenge */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl font-mono text-xs">
              <button
                type="button"
                onClick={() => setTwoFactorTab("totp")}
                className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  twoFactorTab === "totp"
                    ? "bg-white dark:bg-[#15171e] text-neutral-900 dark:text-white shadow-xs font-semibold"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{lang === "RO" ? "Cod Telefon (TOTP)" : "Phone Code (TOTP)"}</span>
              </button>
              <button
                type="button"
                onClick={() => setTwoFactorTab("recovery")}
                className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  twoFactorTab === "recovery"
                    ? "bg-white dark:bg-[#15171e] text-neutral-900 dark:text-white shadow-xs font-semibold"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === "RO" ? "Cod Recuperare" : "Recovery Code"}</span>
              </button>
            </div>

            {twoFactorTab === "totp" ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                    {lang === "RO" ? "Cod TOTP (6 Cifre din Aplicație)" : "TOTP Code (6 Digits from App)"}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.3em] py-3 text-lg font-mono bg-neutral-50 dark:bg-[#181a20] border border-neutral-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || totpCode.length < 6}
                  className="w-full py-3.5 px-6 bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 text-xs font-mono font-semibold tracking-widest uppercase transition-all flex items-center justify-center gap-2 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <span>{lang === "RO" ? "Verifică & Conectează" : "Verify & Sign In"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRecoveryCodeLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                    {lang === "RO" ? "Cod de Recuperare (ex: 7K2M-9P4X)" : "Recovery Code (e.g. 7K2M-9P4X)"}
                  </label>
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={handleRecoveryCodeChange}
                    placeholder="ABCD-EF12"
                    className="w-full text-center tracking-[0.2em] py-3 text-base font-mono uppercase bg-neutral-50 dark:bg-[#181a20] border border-neutral-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !recoveryCode.trim()}
                  className="w-full py-3.5 px-6 bg-amber-600 hover:bg-amber-700 text-white text-xs font-mono font-semibold tracking-widest uppercase transition-all flex items-center justify-center gap-2 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>{lang === "RO" ? "Conectează cu Cod Recuperare" : "Sign In with Recovery Code"}</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => setTwoFactorChallenge(false)}
              className="w-full text-center text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-white pt-2 cursor-pointer flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === "RO" ? "Înapoi la formularul de logare" : "Back to login form"}</span>
            </button>
          </div>
        ) : authMethod === "password" ? (
          /* FORMULAR STANDARD (EMAIL + PAROLĂ) */
          <form onSubmit={handlePasswordLogin} noValidate className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email-input"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2"
              >
                {lang === "RO" ? "Adresă Email" : "Email Address"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => handleBlur("email")}
                  placeholder={lang === "RO" ? "nume@exemplu.com" : "name@example.com"}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                  className={`w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-[#181a20] text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none transition-all font-sans border rounded-xl ${
                    emailError
                      ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500"
                      : "border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-white focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                  }`}
                />
              </div>
              {emailError && (
                <p id="email-error" className="mt-1.5 text-[11px] font-mono text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password-input"
                  className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300"
                >
                  {lang === "RO" ? "Parolă" : "Password"} <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {lang === "RO" ? "Minim 6 caractere" : "Minimum 6 characters"}
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur("password")}
                  placeholder="••••••••••••"
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                  className={`w-full pl-11 pr-11 py-3 bg-neutral-50 dark:bg-[#181a20] text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none transition-all font-sans border rounded-xl ${
                    passwordError
                      ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500"
                      : "border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-white focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                  title={showPassword ? (lang === "RO" ? "Ascunde parola" : "Hide password") : (lang === "RO" ? "Arată parola" : "Show password")}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="mt-1.5 text-[11px] font-mono text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 px-6 bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 text-xs font-mono font-semibold tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2 rounded-xl border border-neutral-950 dark:border-white disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.99]"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>{lang === "RO" ? "Intră în cont" : "Sign In"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* FORMULAR RECUPERARE (EMAIL + COD DE RECUPERARE) */
          <form onSubmit={handleRecoveryCodeLogin} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="recovery-email-input"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2"
              >
                {lang === "RO" ? "Adresă Email Cont" : "Account Email Address"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="recovery-email-input"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => handleBlur("email")}
                  placeholder={lang === "RO" ? "nume@exemplu.com" : "name@example.com"}
                  className={`w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-[#181a20] text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none transition-all font-sans border rounded-xl ${
                    emailError
                      ? "border-red-500 focus:border-red-600"
                      : "border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-white"
                  }`}
                />
              </div>
              {emailError && (
                <p className="mt-1.5 text-[11px] font-mono text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="recovery-code-input"
                  className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300"
                >
                  {lang === "RO" ? "Cod de Recuperare (Backup)" : "Recovery Backup Code"} <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-amber-600 font-mono">
                  {lang === "RO" ? "Unică folosință" : "Single-use"}
                </span>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="recovery-code-input"
                  type="text"
                  value={recoveryCode}
                  onChange={handleRecoveryCodeChange}
                  onBlur={() => handleBlur("recoveryCode")}
                  placeholder="7K2M-9P4X"
                  className={`w-full pl-11 pr-4 py-3 bg-neutral-50 dark:bg-[#181a20] text-sm font-mono tracking-wider uppercase text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none transition-all border rounded-xl ${
                    recoveryCodeError
                      ? "border-red-500 focus:border-red-600"
                      : "border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-white"
                  }`}
                />
              </div>
              {recoveryCodeError && (
                <p className="mt-1.5 text-[11px] font-mono text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{recoveryCodeError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 px-6 bg-amber-600 hover:bg-amber-700 text-white text-xs font-mono font-semibold tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2 rounded-xl disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.99]"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{lang === "RO" ? "Autentificare cu Cod Recuperare" : "Sign In with Recovery Code"}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Quick Role Selectors Demo */}
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-[11px] font-mono font-semibold text-neutral-400 uppercase tracking-widest text-center mb-4">
            {lang === "RO" ? "[ Comutare Rapidă Rol • Demo ]" : "[ Quick Role Switcher • Demo ]"}
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => selectQuickRole("client@booking.com")}
              className={`p-3 border text-left rounded-xl transition-all cursor-pointer ${
                email === "client@booking.com"
                  ? "border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800"
                  : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
              }`}
            >
              <User className="w-4 h-4 mb-2 text-neutral-700 dark:text-neutral-300" />
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                {lang === "RO" ? "Client" : "Client"}
              </div>
              <div className="text-[10px] text-neutral-400 font-mono">
                {lang === "RO" ? "User simplu" : "Regular user"}
              </div>
            </button>

            <button
              type="button"
              onClick={() => selectQuickRole("operator@hotel.com")}
              className={`p-3 border text-left rounded-xl transition-all cursor-pointer ${
                email === "operator@hotel.com"
                  ? "border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800"
                  : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
              }`}
            >
              <Hotel className="w-4 h-4 mb-2 text-neutral-700 dark:text-neutral-300" />
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                {lang === "RO" ? "Manager" : "Manager"}
              </div>
              <div className="text-[10px] text-neutral-400 font-mono">
                {lang === "RO" ? "Operator hotel" : "Hotel operator"}
              </div>
            </button>

            <button
              type="button"
              onClick={() => selectQuickRole("admin@booking.com")}
              className={`p-3 border text-left rounded-xl transition-all cursor-pointer ${
                email === "admin@booking.com"
                  ? "border-neutral-900 bg-neutral-100 dark:border-white dark:bg-neutral-800"
                  : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
              }`}
            >
              <Shield className="w-4 h-4 mb-2 text-neutral-700 dark:text-neutral-300" />
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                {lang === "RO" ? "Admin" : "Admin"}
              </div>
              <div className="text-[10px] text-neutral-400 font-mono">
                {lang === "RO" ? "Administrator" : "Administrator"}
              </div>
            </button>
          </div>
        </div>

        {/* Register Link & Back Link */}
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800/60 text-center space-y-3 font-mono">
          <div>
            <Link
              href="/register"
              className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition tracking-wider"
            >
              {lang === "RO" ? "Nu ai un cont? " : "Don't have an account? "}
              <span className="text-neutral-950 dark:text-white underline underline-offset-4">
                {lang === "RO" ? "Înregistrează-te" : "Register"}
              </span>
            </Link>
          </div>
          <div>
            <Link
              href="/"
              className="text-[11px] uppercase tracking-wider text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors block"
            >
              {lang === "RO" ? "[ ← Înapoi la pagina principală ]" : "[ ← Back to home page ]"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
