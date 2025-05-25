import type { ReactNode } from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import { PageHeader } from './page-header';

interface MainContentAreaProps {
  children: ReactNode;
}

export function MainContentArea({ children }: MainContentAreaProps) {
  return (
    // SidebarInset is the <main> tag. It's already flex-1 by default from shadcn-sidebar
    // and configured as a flex column to stack PageHeader and the content div.
    <SidebarInset className="flex flex-col"> {/* Ensures it's a flex column; bg-background is default */}
      <PageHeader /> {/* Sticky header */}
      {/* This div takes remaining vertical space and handles scrolling for the page content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {children}
      </div>
    </SidebarInset>
  );
}
