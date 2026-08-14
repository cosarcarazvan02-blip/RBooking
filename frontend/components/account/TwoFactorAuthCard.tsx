'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff, QrCode, Check, X, RefreshCw, KeyRound } from 'lucide-react';
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
    // fara cheie - cererea oricum va pica la ApiKeyMiddleware
  }
  return headers;
}

export default function TwoFactorAuthCard() {
  const { lang } = useLanguage();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';

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

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/TwoFactor/status`, { headers: buildAuthHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus('error');
        setStatusError(
          res.status === 401
            ? (lang === 'RO'
                ? 'Sesiunea ta nu mai este validă. Deloghează-te și reconectează-te, apoi încearcă din nou.'
                : 'Your session is no longer valid. Log out and log back in, then try again.')
            : data?.message || (lang === 'RO' ? 'Nu am putut încărca starea 2FA.' : 'Could not load 2FA status.')
        );
        return;
      }
      const data = await res.json();
      setStatus(data.enabled ? 'enabled' : 'disabled');
    } catch (e) {
      console.error('Failed to load 2FA status:', e);
      setStatus('error');
      setStatusError(lang === 'RO' ? 'Eroare de conexiune la server.' : 'Connection error.');
    }
  }, [apiUrl, lang]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

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
        setVerifyError(data?.message || (lang === 'RO' ? 'Cod invalid.' : 'Invalid code.'));
        return;
      }
      setSetupData(null);
      setCode('');
      setVerifyStatus('idle');
      setStatus('enabled');
    } catch {
      setVerifyStatus('error');
      setVerifyError(lang === 'RO' ? 'Eroare de conexiune la server.' : 'Connection error.');
    }
  };

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
    } catch {
      setDisableStatus('error');
      setDisableError(lang === 'RO' ? 'Eroare de conexiune la server.' : 'Connection error.');
    }
  };

  return (
    <div className="bg-white dark:bg-[#111] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-300">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-serif">
              {lang === 'RO' ? 'Autentificare în Doi Pași (2FA)' : 'Two-Factor Authentication (2FA)'}
            </h2>
            <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
              [ {lang === 'RO' ? 'Aplicație Authenticator' : 'Authenticator App'} ]
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
                ? (lang === 'RO' ? 'Activat' : 'Enabled')
                : (lang === 'RO' ? 'Dezactivat' : 'Disabled')}
            </span>
          </span>
        )}
      </div>

      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
        {lang === 'RO'
          ? 'Adaugă un nivel suplimentar de securitate contului tău. Scanează codul QR cu o aplicație de authenticator (Google Authenticator, Authy etc.) și introdu codul generat pentru a confirma activarea.'
          : 'Add an extra layer of security to your account. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.) and enter the generated code to confirm activation.'}
      </p>

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{lang === 'RO' ? 'Se verifică starea...' : 'Checking status...'}</span>
        </div>
      )}

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

      {/* Stare: 2FA dezactivat, setup neinceput */}
      {status === 'disabled' && !setupData && (
        <button
          type="button"
          onClick={handleStartSetup}
          disabled={isStartingSetup}
          className="py-2.5 px-4 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-mono uppercase tracking-widest font-semibold rounded-xl border border-neutral-950 dark:border-white hover:bg-neutral-800 dark:hover:bg-amber-300 dark:hover:text-neutral-950 cursor-pointer transition disabled:opacity-60"
        >
          {isStartingSetup
            ? (lang === 'RO' ? 'Se generează...' : 'Generating...')
            : (lang === 'RO' ? 'Activează 2FA' : 'Enable 2FA')}
        </button>
      )}

      {/* Stare: setup in curs - QR + cod de confirmare */}
      {setupData && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="p-3 bg-white border border-neutral-200 dark:border-neutral-800 rounded-xl shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${setupData.qrCodeImageBase64}`}
                alt="QR Code"
                className="w-40 h-40"
              />
            </div>
            <div className="space-y-2 min-w-0">
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {lang === 'RO'
                  ? 'Nu poți scana codul? Introdu manual această cheie în aplicația de authenticator:'
                  : "Can't scan the code? Enter this key manually in your authenticator app:"}
              </p>
              <div className="px-3 py-2 bg-neutral-50 dark:bg-[#181a20] border border-neutral-300 dark:border-neutral-800 rounded-lg text-xs font-mono break-all flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{setupData.secret}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                {lang === 'RO' ? 'Codul din aplicația Authenticator' : 'Code from your Authenticator App'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full sm:w-48 px-4 py-2.5 bg-neutral-50 dark:bg-[#181a20] text-sm font-mono tracking-[0.3em] text-center text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-white"
                required
              />
            </div>

            {verifyStatus === 'error' && verifyError && (
              <div className="p-3 text-xs font-mono flex items-center gap-2 rounded-xl border bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                <X className="w-3.5 h-3.5 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                disabled={verifyStatus === 'verifying' || code.length !== 6}
                className="flex-1 py-2.5 px-4 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-mono uppercase tracking-widest font-semibold rounded-xl border border-neutral-950 dark:border-white hover:bg-neutral-800 dark:hover:bg-amber-300 dark:hover:text-neutral-950 cursor-pointer text-center transition disabled:opacity-50"
              >
                {verifyStatus === 'verifying'
                  ? (lang === 'RO' ? 'Se verifică...' : 'Verifying...')
                  : (lang === 'RO' ? 'Confirmă' : 'Confirm')}
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

      {/* Stare: 2FA activat */}
      {status === 'enabled' && (
        <div className="space-y-3 pt-2">
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs font-mono flex items-center gap-2 rounded-xl">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>
              {lang === 'RO'
                ? 'Contul tău este protejat cu autentificare în doi pași.'
                : 'Your account is protected with two-factor authentication.'}
            </span>
          </div>

          {!showDisableForm ? (
            <button
              type="button"
              onClick={() => setShowDisableForm(true)}
              className="py-2.5 px-4 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-mono uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition"
            >
              {lang === 'RO' ? 'Dezactivează 2FA' : 'Disable 2FA'}
            </button>
          ) : (
            <form onSubmit={handleDisable} className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  {lang === 'RO'
                    ? 'Introdu codul curent pentru a confirma dezactivarea'
                    : 'Enter the current code to confirm disabling'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full sm:w-48 px-4 py-2.5 bg-neutral-50 dark:bg-[#181a20] text-sm font-mono tracking-[0.3em] text-center text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-white"
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
                  className="flex-1 py-2.5 px-4 bg-red-600 text-white text-xs font-mono uppercase tracking-widest font-semibold rounded-xl hover:bg-red-700 cursor-pointer text-center transition disabled:opacity-50"
                >
                  {disableStatus === 'submitting'
                    ? (lang === 'RO' ? 'Se dezactivează...' : 'Disabling...')
                    : (lang === 'RO' ? 'Confirmă Dezactivarea' : 'Confirm Disable')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDisableForm(false);
                    setDisableCode('');
                    setDisableStatus('idle');
                    setDisableError('');
                  }}
                  className="py-2.5 px-4 border border-neutral-300 dark:border-neutral-800 rounded-xl text-xs font-mono uppercase tracking-widest text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition"
                >
                  {lang === 'RO' ? 'Anulează' : 'Cancel'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
