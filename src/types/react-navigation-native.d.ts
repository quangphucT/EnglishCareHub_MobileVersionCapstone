declare module "@react-navigation/native" {
  import * as React from "react";

  export type ParamListBase = Record<string, object | undefined>;

  export type RouteProp<
    ParamList extends ParamListBase,
    RouteName extends keyof ParamList = string
  > = {
    key: string;
    name: RouteName;
    params: ParamList[RouteName];
  };

  export interface NavigationProp<
    ParamList extends ParamListBase = ParamListBase,
    RouteName extends keyof ParamList = string
  > {
    navigate(
      screen: RouteName | string,
      params?: ParamList[RouteName] | object
    ): void;
    goBack(): void;
  }

  export interface NavigationContainerRef<
    ParamList extends ParamListBase = ParamListBase
  > {
    isReady(): boolean;
    reset(state: any): void;
    navigate(
      name: string,
      params?: ParamList[keyof ParamList] | object
    ): void;
  }

  export interface LinkingOptions<ParamList extends ParamListBase> {
    prefixes: string[];
    config?: Record<string, any>;
  }

  export function useNavigation<
    T extends NavigationProp<any> = NavigationProp
  >(): T;

  export function useRoute<
    T extends RouteProp<ParamListBase> = RouteProp<ParamListBase>
  >(): T;

  export function useNavigationContainerRef<
    ParamList extends ParamListBase = ParamListBase
  >(): NavigationContainerRef<ParamList> & { current?: NavigationContainerRef<ParamList> | null };

  export function useFocusEffect(effect: () => void | (() => void)): void;

  export const NavigationContainer: React.ComponentType<{
    children?: React.ReactNode;
    ref?: React.Ref<NavigationContainerRef<any>>;
    linking?: LinkingOptions<ParamListBase>;
    onReady?: () => void;
  }>;
}



