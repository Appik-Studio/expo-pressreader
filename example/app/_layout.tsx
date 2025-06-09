import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const RootLayout = () => (
  <>
    <StatusBar style="auto" />
    <Stack>
      <Stack.Screen name="index" options={{ title: 'PressReader SDK' }} />
    </Stack>
  </>
);

export default RootLayout;
