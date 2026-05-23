import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

export default function Index() {
  const { loading } = useAuth();
  const [minDone, setMinDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinDone(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!minDone || loading) return <LoadingScreen />;

  return <Redirect href="/(tabs)/" />;
}
