import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const { user, isLoading, loadSession } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Route based on role
      if (user.role === 'STAFF') {
        router.replace('/(staff)/dashboard');
      } else if (user.role === 'MC') {
        router.replace('/(mc)/dashboard');
      } else {
        router.replace('/');
      }
    }
  }, [user, isLoading, segments]);

  return <Slot />;
}
