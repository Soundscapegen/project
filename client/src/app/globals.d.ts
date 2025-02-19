export {};

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: { 
            client_id: string; 
            callback: (response: { credential: string }) => void; 
          }) => void;
          renderButton: (element: HTMLElement | null, options: { theme: string; size: string }) => void;
          prompt: () => void;
        };
      };
    };
  }
}
