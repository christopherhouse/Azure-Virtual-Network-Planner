'use client';

import { useApp } from '@/context/app-context';
import { ProjectList } from '@/components/project-list';
import { ProjectWorkspace } from '@/components/project-workspace';
import { Header } from '@/components/header';

export default function Home() {
  const { activeProject } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {activeProject ? <ProjectWorkspace project={activeProject} /> : <ProjectList />}
      </main>
    </div>
  );
}
