'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  QrCode,
  Check,
  X,
  RefreshCw,
  KeyRound,
  Copy,
  Download,
  Printer,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getActiveApiKey } from '@/lib/apiKey';

interface SetupData {
  secret: string;
  otpAuthUri: string;
  qrCodeImageBase64: string;
}

function buildAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const rawToken = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
  if (rawToken) {
    headers['Authorization'] = `Bearer ${rawToken.replace(/^"|"$/g, '').replace(/^Bearer\s+/i, '').trim()}`;
  }
  try {
    const apiKey = getActiveApiKey();
    if (apiKey) headers['X-Api-Key'] = apiKey;
  } catch {
    // fara cheie
  }
  return headers;
}

export default function TwoFactorAuthCard() {
  const { lang } = useLanguage();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';

  // 2FA TOTP State
  const [status, setStatus] = useState<'loading' | 'enabled' | 'disabled' | 'error'>('loading');
  const [statusError, setStatusError] = useState('');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [isStartingSetup, setIsStartingSetup] = useState(false);

  const [code, setCode] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'error'>('idle');
  const [verifyError, setVerifyError] = useState('');

  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableStatus, setDisableStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [disableError, setDisableError] = useState('');

  // Recovery Codes State
  const [hasRecoveryCodes, setHasRecoveryCodes] = useState(false);
  const [totalCodes, setTotalCodes] = useState(0);
  const [remainingCodes, setRemainingCodes] = useState(0);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [recoveryStatusMessage, setRecoveryStatusMessage] = useState<{
    ro: string;
    en: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Fetch Recovery Codes Status
  const fetchRecoveryCodesStatus = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/Auth/recovery-codes/status`, {
        method: 'GET',
        headers: buildAuthHeaders(),
      });

      if (res.ok && res.status !== 204) {
        const text = await res.text();
        if (text && text.trim()) {
          const data = JSON.parse(text);
          setHasRecoveryCodes(Boolean(data.hasRecoveryCodes));
          setTotalCodes(Number(data.totalCodes) || 0);
          setRemainingCodes(Number(data.remainingCodes) || 0);
        }
      }
    } catch {
      // ignore
    }
  }, [apiUrl]);

  // Load overall 2FA Status
  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/TwoFactor/status`, { headers: buildAuthHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus('error');
        setStatusError(
          res.status === 401
            ? (lang === 'RO'
                ? 'Sesiunea ta nu mai este validă. Vă rugăm să vă reconectați din nou.'
                : 'Your session is no longer valid. Please log in again.')
            : data?.message || (lang === 'RO' ? 'Nu am putut încărca starea 2FA.' : 'Could not load 2FA status.')
        );
        return;
      }
      const data = await res.json();
      const isEnabled = Boolean(data.enabled);
      setStatus(isEnabled ? 'enabled' : 'disabled');
      if (isEnabled) {
        void fetchRecoveryCodesStatus();
      }
    } catch (e) {
      console.error('Failed to load 2FA status:', e);
      setStatus('error');
      setStatusError(lang === 'RO' ? 'Eroare de conexiune la server.' : 'Connection error.');
    }
  }, [apiUrl, lang, fetchRecoveryCodesStatus]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  // Start 2FA Setup (Generate QR)
  const handleStartSetup = async () => {
    setIsStartingSetup(true);
    setVerifyStatus('idle');
    setVerifyError('');
    setCode('');
    try {
      const res = await fetch(`${apiUrl}/TwoFactor/setup`, { method: 'POST', headers: buildAuthHeaders() });
      if (!res.ok) throw new Error('setup failed');
      const data = await res.json();
      setSetupData({
        secret: data.secret,
        otpAuthUri: data.otpAuthUri,
        qrCodeImageBase64: data.qrCodeImageBase64,
      });
    } catch (e) {
      console.error('Failed to start 2FA setup:', e);
      setVerifyStatus('error');
      setVerifyError(
        lang === 'RO' ? 'Nu am putut genera codul QR. Încearcă din nou.' : 'Could not generate the QR code. Please try again.'
      );
    } finally {
      setIsStartingSetup(false);
    }
  };

  const handleCancelSetup = () => {
    setSetupData(null);
    setCode('');
    setVerifyStatus('idle');
    setVerifyError('');
  };

  // Verify TOTP from QR Code to confirm and enable 2FA
  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setVerifyStatus('verifying');
    setVerifyError('');
    try {
      const res = await fetch(`${apiUrl}/TwoFactor/verify`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setVerifyStatus('error');
        setVerifyError(data?.message || (lang === 'RO' ? 'Cod invalid. Vă rugăm să reîncercați.' : 'Invalid code. Please try again.'));
        return;
      }
      setSetupData(null);
      setCode('');
      setVerifyStatus('idle');
      setStatus('enabled');

      // 2FA is now verified & active -> fetch or automatically generate recovery codes
      await fetchRecoveryCodesStatus();
      setRecoveryStatusMessage({
        ro: '✓ Autentificarea în 2 pași a fost activată cu succes! Generează acum setul de coduri de recuperare pentru siguranță.',
        en: '✓ Two-Factor Authentication enabled successfully! Generate your backup recovery codes now for safety.',
        type: 'success',
      });
    } catch {
      setVerifyStatus('error');
      setVerifyError(lang === 'RO' ? 'Eroare de conexiune la server.' : 'Connection error.');
    }
  };

  // Disable 2FA
  const handleDisable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDisableStatus('submitting');
    setDisableError('');
    try {
      const res = await fetch(`${apiUrl}/TwoFactor/disable`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setDisableStatus('error');
        setDisableError(data?.message || (lang === 'RO' ? 'Cod invalid.' : 'Invalid code.'));
        return;
      }
      setStatus('disabled');
      setShowDisableForm(false);
      setDisableCode('');
      setDisableStatus('idle');
      setGeneratedCodes([]);
      setHasRecoveryCodes(false);
      setRemainingCodes(0);
      setRecoveryStatusMessage(null);
    } catch {
      setDisableStatus('error');
      setDisableError(lang === 'RO' ? 'Eroare de conexiune la server.' : 'Connection error.');
    }
  };

  // Generate / Regenerate Recovery Codes
  const handleGenerateRecoveryCodes = async () => {
    setIsGeneratingCodes(true);
    setRecoveryStatusMessage(null);

    try {
      const res = await fetch(`${apiUrl}/Auth/recovery-codes/generate`, {
        method: 'POST',
        headers: buildAuthHeaders(),
      });

      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        const codes: string[] = data.codes || [];
        setGeneratedCodes(codes);
        setTotalCodes(data.totalCount || codes.length);
        setRemainingCodes(data.remainingCount || codes.length);
        setHasRecoveryCodes(true);
        setRecoveryStatusMessage({
          ro: '✓ Set nou de 10 coduri de recuperare generat și salvat în baza de date! Salvați-le într-un loc sigur.',
          en: '✓ New set of 10 recovery codes generated and saved to database! Save them in a secure place.',
          type: 'success',
        });
      } else {
        const text = await res.text().catch(() => '');
        let errData: any = null;
        try {
          if (text) errData = JSON.parse(text);
        } catch {}

        setRecoveryStatusMessage({
          ro: errData?.message || 'Eroare la generarea codurilor pe server.',
          en: errData?.message || 'Error generating codes on server.',
          type: 'error',
        });
      }
    } catch {
      setRecoveryStatusMessage({
        ro: 'Eroare de conexiune la server la generarea codurilor.',
        en: 'Connection error when generating codes.',
        type: 'error',
      });
    } finally {
      setIsGeneratingCodes(false);
    }
  };

  const handleCopySingleCode = (c: string, idx: number) => {
    navigator.clipboard.writeText(c);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAllCodes = () => {
    if (generatedCodes.length === 0) return;
    const textToCopy = `RBooking - Coduri de Recuperare 2FA (${new Date().toLocaleDateString()}):\n\n` +
      generatedCodes.map((c, i) => `${(i + 1).toString().padStart(2, '0')}. ${c}`).join('\n') +
      `\n\nNotă: Fiecare cod poate fi utilizat o singură dată.`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleDownloadCodesTxt = () => {
    if (generatedCodes.length === 0) return;
    const content = `====================================================\n` +
      `       RBOOKING - CODURI DE RECUPERARE 2FA\n` +
      `====================================================\n\n` +
      `Data generării: ${new Date().toLocaleString()}\n` +
      `Total coduri: ${generatedCodes.length}\n\n` +
      `Fiecare cod este de unică folosință. Salvează acest fișier\n` +
      `într-un loc sigur (ex: password manager sau seif digital).\n\n` +
      `CODURILE TALE DE RECUPERARE:\n` +
      `----------------------------------------------------\n` +
      generatedCodes.map((c, i) => `  [${(i + 1).toString().padStart(2, '0')}]  ${c}`).join('\n') +
      `\n----------------------------------------------------\n\n` +
      `Cum se folosesc:\n` +
      `Dacă nu ai telefonul la îndemână pentru a introduce codul TOTP,\n` +
      `alege opțiunea "Folosește un cod de recuperare" pe ecranul de Login.\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rbooking-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintCodes = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header Unificat: 2FA & Recovery Codes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-300">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif">
              {lang === 'RO'
                ? 'Autentificare în Doi Pași (2FA) & Coduri de Recuperare'
                : 'Two-Factor Authentication (2FA) & Recovery Codes'}
            </h2>
            <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
              [ {lang === 'RO' ? 'Securitate Cont & Cheie QR' : 'Account Security & QR Key'} ]
            </p>
          </div>
        </div>

        {(status === 'enabled' || status === 'disabled') && (
          <span
            className={`self-start sm:self-auto px-2.5 py-1 text-[11px] font-mono rounded-lg flex items-center gap-1.5 ${
              status === 'enabled'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {status === 'enabled' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
            <span>
              {status === 'enabled'
                ? (lang === 'RO' ? '2FA Activat' : '2FA Enabled')
                : (lang === 'RO' ? '2FA Dezactivat' : '2FA Disabled')}
            </span>
          </span>
        )}
      </div>

      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {lang === 'RO'
          ? 'Protejează-ți contul împotriva accesului neautorizat. Configurează aplicația de autentificare (Google Authenticator, Authy etc.) prin scanarea codului QR, iar apoi vei avea acces la setul tău de coduri de recuperare.'
          : 'Protect your account against unauthorized access. Set up your authenticator app (Google Authenticator, Authy, etc.) by scanning the QR code, which will then unlock your backup recovery codes.'}
      </p>

      {/* Loading State */}
      {status === 'loading' && (
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 py-3">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{lang === 'RO' ? 'Se verifică starea 2FA...' : 'Checking 2FA status...'}</span>
        </div>
      )}

      {/* Error Loading State */}
      {status === 'error' && (
        <div className="space-y-3">
          <div className="p-3 text-xs font-mono flex items-center gap-2 rounded-xl border bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
            <X className="w-3.5 h-3.5 shrink-0" />
            <span>{statusError}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setStatus('loading');
              void loadStatus();
            }}
            className="py-2.5 px-4 border border-neutral-300 dark:border-neutral-800 rounded-xl text-xs font-mono uppercase tracking-widest text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition"
          >
            {lang === 'RO' ? 'Reîncearcă' : 'Retry'}
          </button>
        </div>
      )}

      {/* Stare 1: 2FA Dezactivat - Buton Activare */}
      {status === 'disabled' && !setupData && (
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-neutral-50 dark:bg-[#16181e] border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-start gap-3">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                {lang === 'RO' ? 'Pasul 1: Configurează codul QR' : 'Step 1: Set up QR Code'}
              </p>
              <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {lang === 'RO'
                  ? 'După ce scanezi codul QR și introduci cheia corectă din aplicație, se va activa autentificarea în 2 pași și vei primi automat codurile de recuperare de urgență.'
                  : 'After scanning the QR code and verifying the authenticator key, 2FA will be activated and your backup recovery codes will be unlocked.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartSetup}
            disabled={isStartingSetup}
            className="py-2.5 px-5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-mono uppercase tracking-widest font-semibold rounded-xl border border-neutral-950 dark:border-white hover:bg-neutral-800 dark:hover:bg-amber-300 dark:hover:text-neutral-950 cursor-pointer transition disabled:opacity-60 flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            <span>
              {isStartingSetup
                ? (lang === 'RO' ? 'Se generează QR...' : 'Generating QR...')
                : (lang === 'RO' ? 'Scanează Codul QR pentru Activare' : 'Scan QR Code to Enable')}
            </span>
          </button>
        </div>
      )}

      {/* Stare 2: Setup in curs - Afișare QR Code + Input Cheie TOTP */}
      {setupData && (
        <div className="space-y-5 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="p-3 bg-white border border-neutral-200 dark:border-neutral-800 rounded-xl shrink-0 shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${setupData.qrCodeImageBase64}`}
                alt="QR Code 2FA"
                className="w-40 h-40"
              />
            </div>
            <div className="space-y-3 min-w-0 flex-1">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {lang === 'RO' ? 'Scanează codul cu telefonul' : 'Scan code with your phone'}
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  {lang === 'RO'
                    ? 'Deschide Google Authenticator, Authy sau 1Password și scanează imaginea alăturată.'
                    : 'Open Google Authenticator, Authy, or 1Password and scan the image.'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-mono uppercase text-neutral-500">
                  {lang === 'RO' ? 'Sau introdu cheia manual:' : 'Or enter key manually:'}
                </p>
                <div className="px-3 py-2 bg-neutral-50 dark:bg-[#181a20] border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs font-mono break-all flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">{setupData.secret}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formular Verificare Cheie QR */}
          <form onSubmit={handleVerify} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                {lang === 'RO'
                  ? 'Introdu codul de 6 cifre generat de aplicație pentru confirmare:'
                  : 'Enter the 6-digit code from the app to confirm:'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full sm:w-56 px-4 py-2.5 bg-neutral-50 dark:bg-[#181a20] text-base font-mono tracking-[0.35em] text-center text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-white"
                required
                autoFocus
              />
            </div>

            {verifyStatus === 'error' && verifyError && (
              <div className="p-3 text-xs font-mono flex items-center gap-2 rounded-xl border bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                <X className="w-3.5 h-3.5 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="submit"
                disabled={verifyStatus === 'verifying' || code.length !== 6}
                className="flex-1 py-2.5 px-5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-mono uppercase tracking-widest font-semibold rounded-xl border border-neutral-950 dark:border-white hover:bg-neutral-800 dark:hover:bg-amber-300 dark:hover:text-neutral-950 cursor-pointer text-center transition disabled:opacity-50"
              >
                {verifyStatus === 'verifying'
                  ? (lang === 'RO' ? 'Se verifică cheia...' : 'Verifying key...')
                  : (lang === 'RO' ? 'Confirmă & Deblochează Codurile de Recuperare' : 'Confirm & Unlock Recovery Codes')}
              </button>
              <button
                type="button"
                onClick={handleCancelSetup}
                className="py-2.5 px-4 border border-neutral-300 dark:border-neutral-800 rounded-xl text-xs font-mono uppercase tracking-widest text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition"
              >
                {lang === 'RO' ? 'Anulează' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stare 3: 2FA Activat -> SE AFIȘEAZĂ COMPLET SECȚIUNEA DE RECOVERY CODES */}
      {status === 'enabled' && (
        <div className="space-y-6 pt-2">
          {/* Banner Confirmare 2FA Activ */}
          <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800 text-xs font-mono flex items-center justify-between gap-3 rounded-xl">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {lang === 'RO'
                  ? 'Autentificarea în 2 pași este ACTIVĂ pe contul tău.'
                  : 'Two-Factor Authentication is ACTIVE on your account.'}
              </span>
            </div>

            {hasRecoveryCodes && (
              <span className={`px-2.5 py-0.5 text-[11px] font-mono rounded-md shrink-0 ${
                remainingCodes <= 2
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200 font-semibold'
                  : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
              }`}>
                {remainingCodes} {lang === 'RO' ? 'coduri rămase' : 'codes left'}
              </span>
            )}
          </div>

          {/* Mesaj de stare (notificare) */}
          {recoveryStatusMessage && (
            <div
              className={`p-3.5 text-xs font-mono flex items-center gap-2.5 rounded-xl border ${
                recoveryStatusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
                  : recoveryStatusMessage.type === 'error'
                  ? 'bg-red-50 text-red-900 border-red-300 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800'
                  : 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800'
              }`}
            >
              {recoveryStatusMessage.type === 'success' && <Check className="w-4 h-4 shrink-0 text-emerald-600" />}
              {recoveryStatusMessage.type === 'error' && <X className="w-4 h-4 shrink-0 text-red-600" />}
              {recoveryStatusMessage.type === 'info' && <ShieldAlert className="w-4 h-4 shrink-0 text-blue-600" />}
              <span>{lang === 'RO' ? recoveryStatusMessage.ro : recoveryStatusMessage.en}</span>
            </div>
          )}

          {/* Secțiunea integrată de Coduri de Recuperare */}
          <div className="p-5 bg-neutral-50 dark:bg-[#16181e] border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {lang === 'RO' ? 'Coduri de Recuperare de Urgență' : 'Emergency Backup Recovery Codes'}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {lang === 'RO'
                      ? 'Folosește un cod de rezervă dacă nu ai acces la telefon sau la aplicația Authenticator.'
                      : 'Use a backup code if you lose access to your phone or Authenticator app.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateRecoveryCodes}
                disabled={isGeneratingCodes}
                className="px-4 py-2 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-amber-300 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingCodes ? 'animate-spin' : ''}`} />
                <span>
                  {isGeneratingCodes
                    ? (lang === 'RO' ? 'Se generează...' : 'Generating...')
                    : hasRecoveryCodes
                    ? (lang === 'RO' ? 'Regenerează Setul de 10 Coduri' : 'Regenerate 10 Codes')
                    : (lang === 'RO' ? 'Generează 10 Coduri de Recuperare' : 'Generate 10 Recovery Codes')}
                </span>
              </button>
            </div>

            {/* Dacă avem coduri proaspăt generate -> afișăm grila */}
            {generatedCodes.length > 0 ? (
              <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-amber-900 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {lang === 'RO' ? 'Salvează aceste coduri acum!' : 'Save these codes now!'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {generatedCodes.length} {lang === 'RO' ? 'coduri' : 'codes'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {generatedCodes.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white dark:bg-[#13151a] border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between font-mono text-xs shadow-2xs group hover:border-amber-500/50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-400 text-[10px] w-5">{(idx + 1).toString().padStart(2, '0')}.</span>
                        <span className="font-semibold tracking-wider text-neutral-900 dark:text-neutral-100">{c}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopySingleCode(c, idx)}
                        className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
                        title={lang === 'RO' ? 'Copiază codul' : 'Copy code'}
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Acțiuni pentru toate codurile */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-500/20">
                  <button
                    type="button"
                    onClick={handleCopyAllCodes}
                    className="flex-1 py-2 px-3 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-mono uppercase tracking-wider font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-amber-300 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAll ? (lang === 'RO' ? 'Copiate!' : 'Copied!') : (lang === 'RO' ? 'Copiază Toate' : 'Copy All')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCodesTxt}
                    className="py-2 px-3 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === 'RO' ? 'Descarcă .TXT' : 'Download .TXT'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintCodes}
                    className="py-2 px-3 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-neutral-800 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{lang === 'RO' ? 'Printează' : 'Print'}</span>
                  </button>
                </div>
              </div>
            ) : hasRecoveryCodes ? (
              <div className="p-3 bg-white dark:bg-[#181a20] border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-600 dark:text-neutral-300">
                  {lang === 'RO'
                    ? `Ai ${remainingCodes} din ${totalCodes} coduri de recuperare active.`
                    : `You have ${remainingCodes} of ${totalCodes} recovery codes active.`}
                </span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {lang === 'RO' ? 'Protejat' : 'Protected'}
                </span>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs font-mono text-amber-800 dark:text-amber-300">
                {lang === 'RO'
                  ? 'Apasă pe "Generează 10 Coduri de Recuperare" pentru a avea chei de rezervă în caz de urgență.'
                  : 'Click "Generate 10 Recovery Codes" to create backup emergency keys.'}
              </div>
            )}
          </div>

          {/* Opțiune Dezactivare 2FA */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
            {!showDisableForm ? (
              <button
                type="button"
                onClick={() => setShowDisableForm(true)}
                className="py-2 px-4 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition"
              >
                {lang === 'RO' ? 'Dezactivează 2FA' : 'Disable 2FA'}
              </button>
            ) : (
              <form onSubmit={handleDisable} className="w-full space-y-3 p-4 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl">
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                    {lang === 'RO'
                      ? 'Introdu codul curent din aplicația Authenticator pentru dezactivare:'
                      : 'Enter the current code from your Authenticator App to disable:'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full sm:w-48 px-4 py-2 bg-white dark:bg-[#181a20] text-sm font-mono tracking-[0.3em] text-center text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                {disableStatus === 'error' && disableError && (
                  <div className="p-3 text-xs font-mono flex items-center gap-2 rounded-xl border bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                    <X className="w-3.5 h-3.5 shrink-0" />
                    <span>{disableError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    disabled={disableStatus === 'submitting' || disableCode.length !== 6}
                    className="py-2 px-4 bg-red-600 text-white text-xs font-mono uppercase tracking-wider font-semibold rounded-xl hover:bg-red-700 cursor-pointer transition disabled:opacity-50"
                  >
                    {disableStatus === 'submitting'
                      ? (lang === 'RO' ? 'Se dezactivează...' : 'Disabling...')
                      : (lang === 'RO' ? 'Confirmă Dezactivarea 2FA' : 'Confirm Disable 2FA')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisableForm(false);
                      setDisableCode('');
                      setDisableStatus('idle');
                      setDisableError('');
                    }}
                    className="py-2 px-4 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition"
                  >
                    {lang === 'RO' ? 'Anulează' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
