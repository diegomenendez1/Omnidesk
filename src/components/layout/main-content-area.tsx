import type { ReactNode } from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import { PageHeader } from './page-header';

interface MainContentAreaProps {
  children: ReactNode;
}

export function MainContentArea({ children }: MainContentAreaProps) {
  return (
    // SidebarInset is the <main> tag. It's already flex-1 by default from shadcn-sidebar.
    // Adding overflow-x-hidden to prevent its content from pushing its boundaries horizontally.
    <SidebarInset className="flex flex-col overflow-x-hidden"> {/* Ensures it's a flex column and clips horizontal overflow */}
      <PageHeader /> {/* Sticky header */}
      {/* This div takes remaining vertical space and handles scrolling for the page content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {children}
      </div>
    </SidebarInset>
  );
}
