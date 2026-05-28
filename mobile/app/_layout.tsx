import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import CartToast from '../components/CartToast';
import WishlistToast from '../components/WishlistToast';
import AuthPromptModal from '../components/AuthPromptModal';
import { prefetchHomeData } from '../utils/prefetch';

SplashScreen.preventAutoHideAsync();

// Start fetching home screen data immediately — before any component mounts
prefetchHomeData();

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <StatusBar style="light" />
          <CartToast />
          <WishlistToast />
          <AuthPromptModal />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="book/[id]"       options={{ headerShown: false }} />
            <Stack.Screen name="new-arrivals"    options={{ headerShown: false }} />
            <Stack.Screen name="bestsellers"     options={{ headerShown: false }} />
            <Stack.Screen name="fiction"         options={{ headerShown: false }} />
            <Stack.Screen name="non-fiction"     options={{ headerShown: false }} />
            <Stack.Screen name="popular"         options={{ headerShown: false }} />
            <Stack.Screen name="special-offers"  options={{ headerShown: false }} />
            <Stack.Screen name="childrens"       options={{ headerShown: false }} />
            <Stack.Screen
              name="orders/index"
              options={{ headerShown: true, headerTitle: 'My Orders', headerTintColor: '#0A1628', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="orders/[id]"
              options={{ headerShown: true, headerTitle: 'Order Details', headerTintColor: '#0A1628', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="checkout/index"
              options={{ headerShown: true, headerTitle: 'Checkout', headerTintColor: '#0A1628', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="addresses/index"
              options={{ headerShown: true, headerTitle: 'My Addresses', headerTintColor: '#0A1628', headerBackTitle: '' }}
            />
            <Stack.Screen name="reviews/index"   options={{ headerShown: false }} />
            <Stack.Screen name="privacy-policy"  options={{ headerShown: false }} />
            <Stack.Screen name="chat"            options={{ headerShown: false }} />
            <Stack.Screen name="support"         options={{ headerShown: false }} />
          </Stack>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
