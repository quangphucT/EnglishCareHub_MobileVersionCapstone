// App.tsx
import React from "react";
import { Provider } from "react-redux";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from "./src/store";
import AppNavigator from "./src/navigation/AppNavigator";
import queryClient from "./src/config/queryClient";
import "./src/global.css";
import { RealtimeProvider } from "./src/utils/realtimeProvider";

export default function App() {
  
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <RealtimeProvider>
            <AppNavigator />
          </RealtimeProvider>
        </Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
