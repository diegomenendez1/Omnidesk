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
    // Adding min-w-0 to allow the flex item to shrink beyond its content's intrinsic width.
    <SidebarInset className="flex flex-col overflow-x-hidden min-w-0"> {/* Ensures it's a flex column, clips horizontal overflow, and can shrink */}
      <PageHeader /> {/* Sticky header */}
      {/* This div takes remaining vertical space and handles scrolling for the page content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {children}
      </div>
    </SidebarInset>
  );
}
