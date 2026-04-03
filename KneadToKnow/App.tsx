import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/hooks/useAuth';
import { RecipeProvider } from './src/hooks/useRecipes';
import { ActiveBakeProvider } from './src/hooks/useActiveBake';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'PlayfairDisplay-Bold': require('./assets/fonts/PlayfairDisplay-Bold.ttf'),
        'PlayfairDisplay-ExtraBold': require('./assets/fonts/PlayfairDisplay-ExtraBold.ttf'),
        'DMSans-Regular': require('./assets/fonts/DMSans-Regular.ttf'),
        'DMSans-Medium': require('./assets/fonts/DMSans-Medium.ttf'),
        'DMSans-SemiBold': require('./assets/fonts/DMSans-SemiBold.ttf'),
        'DMSans-Bold': require('./assets/fonts/DMSans-Bold.ttf'),
        'DMMono-Regular': require('./assets/fonts/DMMono-Regular.ttf'),
      });
      setFontsLoaded(true);
      await SplashScreen.hideAsync();
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#faf5ec" />
      <AuthProvider>
        <RecipeProvider>
          <ActiveBakeProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </ActiveBakeProvider>
        </RecipeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
