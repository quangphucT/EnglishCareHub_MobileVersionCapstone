// App.tsx
import React from "react";
import { Provider } from "react-redux";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from "./src/store";
import AppNavigator from "./src/navigation/AppNavigator";
import "./src/global.css";

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AppNavigator />
      </Provider>
    </SafeAreaProvider>
  );
}
