import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import CreateProjectModal from "../components/CreateProjectModal";
import HeroSection from "../components/HeroSection";
import ProjectDetailModal from "../components/ProjectDetailModal";
import ProjectsList from "../components/ProjectsList";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetAllProjects } from "../hooks/useQueries";

export default function Dashboard() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: projects = [], isLoading } = useGetAllProjects();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  if (!isAuthenticated) {
    return <HeroSection />;
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Manage your AI-generated YouTube videos
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          size="lg"
          className="gap-2"
        >
          <Plus className="w-5 h-5" />
          New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      ) : (
        <ProjectsList
          projects={projects}
          onSelectProject={setSelectedProjectId}
        />
      )}

      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <ProjectDetailModal
        projectId={selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />
    </div>
  );
}
