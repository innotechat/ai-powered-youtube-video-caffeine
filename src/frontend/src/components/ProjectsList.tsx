import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Eye, Trash2, Video } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { PartialProject } from "../backend";
import { useDeleteProject } from "../hooks/useQueries";

interface ProjectsListProps {
  projects: PartialProject[];
  onSelectProject: (projectId: string) => void;
}

export default function ProjectsList({
  projects,
  onSelectProject,
}: ProjectsListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const deleteProject = useDeleteProject();

  const handleDeleteClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject.mutateAsync(projectToDelete);
      toast.success("Project deleted successfully");
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project. Please try again.");
    }
  };

  if (projects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Video className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Create your first AI-powered video project to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scripting":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "audioRendering":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "videoMerging":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "finalizing":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "error":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scripting":
        return "Scripting";
      case "audioRendering":
        return "Audio Rendering";
      case "videoMerging":
        return "Video Merging";
      case "finalizing":
        return "Finalizing";
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      default:
        return status;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card
            key={project.projectId}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg line-clamp-2">
                  {project.niche}
                </CardTitle>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{Number(project.length)} min</span>
                </div>
                {project.shorts.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    <span>{project.shorts.length} shorts</span>
                  </div>
                )}
              </div>

              {project.metadata.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.metadata.description}
                </p>
              )}

              {/* Progress indicator for in-progress projects */}
              {[
                "scripting",
                "audioRendering",
                "videoMerging",
                "finalizing",
              ].includes(project.status) && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{Number(project.progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${Number(project.progress)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => onSelectProject(project.projectId)}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Button>
                <Button
                  onClick={(e) => handleDeleteClick(project.projectId, e)}
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={deleteProject.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <img
                src="/assets/generated/warning-confirmation-icon-transparent.dim_48x48.png"
                alt="Warning"
                className="w-6 h-6"
              />
              Delete Project?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project and all associated media files including scripts, audio,
              video clips, and final videos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProject.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteProject.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProject.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
