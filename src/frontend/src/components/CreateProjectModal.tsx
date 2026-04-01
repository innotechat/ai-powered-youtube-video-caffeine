import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateProject } from "../hooks/useQueries";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({
  open,
  onClose,
}: CreateProjectModalProps) {
  const [niche, setNiche] = useState("");
  const [length, setLength] = useState([20]); // Default 20 minutes
  const createProject = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) {
      toast.error("Please enter a niche/topic");
      return;
    }

    try {
      await createProject.mutateAsync({
        length: BigInt(length[0]),
        niche: niche.trim(),
      });
      toast.success("Project created successfully!");
      setNiche("");
      setLength([20]);
      onClose();
    } catch (error) {
      toast.error("Failed to create project");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Video Project</DialogTitle>
            <DialogDescription>
              Set up your video parameters. AI will generate the complete video
              based on your inputs.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="niche">Niche / Topic</Label>
              <Input
                id="niche"
                placeholder="e.g., Tech Reviews, Cooking, Gaming, Finance"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                disabled={createProject.isPending}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Enter the topic or niche for your video content
              </p>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="length">Video Length</Label>
                <span className="text-sm font-medium">{length[0]} minutes</span>
              </div>
              <Slider
                id="length"
                min={15}
                max={30}
                step={1}
                value={length}
                onValueChange={setLength}
                disabled={createProject.isPending}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Choose target video length (15-30 minutes)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createProject.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!niche.trim() || createProject.isPending}
            >
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
