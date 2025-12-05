declare module "@react-navigation/native-stack" {
  import * as React from "react";
  import {
    NavigationContainerRef,
    ParamListBase,
    RouteProp,
  } from "@react-navigation/native";

  export type NativeStackNavigationProp<
    ParamList extends ParamListBase,
    RouteName extends keyof ParamList = string
  > = any;

  export interface NativeStackScreenProps<
    ParamList extends ParamListBase,
    RouteName extends keyof ParamList = string
  > {
    navigation: NativeStackNavigationProp<ParamList, RouteName>;
    route: RouteProp<ParamList, RouteName>;
  }

  export type NativeStackNavigationOptions = any;
  export type NativeStackNavigatorProps = any;

  export function createNativeStackNavigator<
    ParamList extends ParamListBase = ParamListBase
  >(): {
    Navigator: React.ComponentType<NativeStackNavigatorProps>;
    Screen: React.ComponentType<{
      name: keyof ParamList;
      component:
        | React.ComponentType<any>
        | ((props: any) => React.ReactNode | null);
      options?: NativeStackNavigationOptions;
    }>;
  };

  export type NativeStackNavigationRef = NavigationContainerRef<ParamListBase>;
}


