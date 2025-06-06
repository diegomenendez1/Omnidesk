// Type definitions for React modules

import 'react';

declare module 'react' {
  // Add any custom React type declarations here
  
  // Example of extending React's HTMLAttributes
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Add any custom HTML attributes here
  }
}

// Add any other React type declarations you need here
