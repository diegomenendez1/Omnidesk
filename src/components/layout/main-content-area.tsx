import type { ReactNode } from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { PageHeader } from './page-header';

interface MainContentAreaProps {
  children: ReactNode;
}

export function MainContentArea({ children }: MainContentAreaProps) {
  return (
    <SidebarInset className="flex-1 flex flex-col overflow-y-auto bg-background">
      <PageHeader />
      <main className="flex-1 p-6">
        {children}
      </main>
    </SidebarInset>
  );
}
