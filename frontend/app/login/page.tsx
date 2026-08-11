'use client';

import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-4 sm:px-6 py-12 text-neutral-900 dark:text-neutral-100">
      <LoginForm />
    </main>
  );
}