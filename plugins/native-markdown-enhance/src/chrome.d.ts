declare const chrome: {
  storage: {
    local: {
      get(key: string): Promise<Record<string, unknown>>;
      set(value: Record<string, unknown>): Promise<void>;
    };
    onChanged: {
      addListener(listener: (changes: Record<string, { newValue?: unknown }>, areaName: string) => void): void;
      removeListener(listener: (changes: Record<string, { newValue?: unknown }>, areaName: string) => void): void;
    };
  };
  action: {
    onClicked: { addListener(listener: () => void): void };
  };
  runtime: {
    openOptionsPage(): Promise<void>;
  };
};
