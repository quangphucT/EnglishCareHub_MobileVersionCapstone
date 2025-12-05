declare module "react-native-sound" {
  export default class Sound {
    constructor(
      filename: string,
      basePath?: string | null,
      onError?: (error?: Error) => void
    );
    static setCategory(
      value: string,
      mixWithOthers?: boolean
    ): void;
    setVolume(value: number): void;
    play(onEnd?: (success: boolean) => void): void;
    stop(onStop?: () => void): void;
    release(): void;
  }
}

