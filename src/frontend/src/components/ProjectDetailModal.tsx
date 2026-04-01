import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Film,
  Image as ImageIcon,
  Music,
  PlayCircle,
  Video,
} from "lucide-react";
import { useState } from "react";
import { useGetProject } from "../hooks/useQueries";
import AutoGenerationPanel from "./AutoGenerationPanel";
import MediaPlayer from "./MediaPlayer";

interface ProjectDetailModalProps {
  projectId: string | null;
  onClose: () => void;
}

export default function ProjectDetailModal({
  projectId,
  onClose,
}: ProjectDetailModalProps) {
  const { data: project, isLoading } = useGetProject(projectId);
  const [showAutoGeneration, setShowAutoGeneration] = useState(false);

  const progress = project ? Number(project.progress) : 0;

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

  const isInProgress =
    project &&
    ["scripting", "audioRendering", "videoMerging", "finalizing"].includes(
      project.status,
    );
  const isCompleted = project?.status === "completed";
  const hasError = project?.status === "error";

  return (
    <Dialog open={!!projectId} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : project ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-2xl">
                    {project.niche}
                  </DialogTitle>
                  <DialogDescription className="mt-2">
                    Project ID: {project.projectId}
                  </DialogDescription>
                </div>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
              </div>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Progress</span>
                    <span className="text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {isInProgress && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
                      {project.status === "scripting" &&
                        "Generating script and analyzing trending content..."}
                      {project.status === "audioRendering" &&
                        "Creating audio narration and background music..."}
                      {project.status === "videoMerging" &&
                        "Fetching video clips and assembling content..."}
                      {project.status === "finalizing" &&
                        "Finalizing video and creating shorts..."}
                    </p>
                  )}
                  {isCompleted && (
                    <p className="text-xs text-emerald-500 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Project completed successfully!
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {hasError && project.error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-destructive font-medium mb-1">
                          Error occurred
                        </p>
                        <p className="text-xs text-destructive/80">
                          {project.error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Auto Generation Panel */}
                {!isCompleted && !hasError && (
                  <>
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <PlayCircle className="w-5 h-5 text-primary" />
                          Auto Generation
                        </h3>
                        <Button
                          size="sm"
                          onClick={() =>
                            setShowAutoGeneration(!showAutoGeneration)
                          }
                          variant={showAutoGeneration ? "secondary" : "default"}
                        >
                          {showAutoGeneration
                            ? "Hide Controls"
                            : "Show Controls"}
                        </Button>
                      </div>
                      {showAutoGeneration && (
                        <AutoGenerationPanel project={project} />
                      )}
                    </div>
                    <Separator />
                  </>
                )}

                {/* Project Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Length:</span>
                    <span className="font-medium">
                      {Number(project.length)} minutes
                    </span>
                  </div>
                  {project.shorts.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Video className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Shorts:</span>
                      <span className="font-medium">
                        {project.shorts.length} clips
                      </span>
                    </div>
                  )}
                </div>

                {/* Media Assets with Players */}
                {(project.audio.url ||
                  project.music ||
                  project.videos.length > 0 ||
                  project.fullVideoLink ||
                  project.originalVideo) && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Film className="w-5 h-5" />
                        Media Assets
                      </h3>

                      <Tabs defaultValue="audio" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger
                            value="audio"
                            disabled={!project.audio.url && !project.music}
                          >
                            Audio
                          </TabsTrigger>
                          <TabsTrigger
                            value="clips"
                            disabled={project.videos.length === 0}
                          >
                            Clips ({project.videos.length})
                          </TabsTrigger>
                          <TabsTrigger
                            value="final"
                            disabled={
                              !project.fullVideoLink && !project.originalVideo
                            }
                          >
                            Final Video
                          </TabsTrigger>
                          <TabsTrigger
                            value="shorts"
                            disabled={project.shortsFiles.length === 0}
                          >
                            Shorts ({project.shortsFiles.length})
                          </TabsTrigger>
                        </TabsList>

                        {/* Audio Tab */}
                        <TabsContent value="audio" className="space-y-4">
                          {project.audio.url && (
                            <div>
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Music className="w-4 h-4 text-primary" />
                                Voice Narration
                              </h4>
                              <MediaPlayer
                                src={project.audio.url}
                                type="audio"
                                title="Voice Narration"
                              />
                            </div>
                          )}
                          {project.music && (
                            <div>
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Music className="w-4 h-4 text-primary" />
                                Background Music
                              </h4>
                              <MediaPlayer
                                src={project.music}
                                type="audio"
                                title="Background Music"
                              />
                            </div>
                          )}
                          {!project.audio.url && !project.music && (
                            <div className="text-center py-8 text-muted-foreground">
                              <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">
                                No audio files available yet
                              </p>
                            </div>
                          )}
                        </TabsContent>

                        {/* Video Clips Tab */}
                        <TabsContent value="clips" className="space-y-4">
                          {project.videos.length > 0 ? (
                            <div className="grid gap-4">
                              {project.videos.map((videoUrl, index) => (
                                <div key={videoUrl || `clip-${index}`}>
                                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-primary" />
                                    Clip {index + 1}
                                  </h4>
                                  <MediaPlayer
                                    src={videoUrl}
                                    type="video"
                                    title={`Video Clip ${index + 1}`}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">
                                No video clips available yet
                              </p>
                            </div>
                          )}
                        </TabsContent>

                        {/* Final Video Tab */}
                        <TabsContent value="final" className="space-y-4">
                          {project.fullVideoLink || project.originalVideo ? (
                            <div>
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Video className="w-4 h-4 text-primary" />
                                Complete Video
                              </h4>
                              <MediaPlayer
                                src={
                                  project.originalVideo
                                    ? project.originalVideo.getDirectURL()
                                    : project.fullVideoLink
                                }
                                type="video"
                                title={`${project.niche} - Full Video`}
                              />
                              {project.fullVideoLink && (
                                <div className="mt-4">
                                  <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    asChild
                                  >
                                    <a href={project.fullVideoLink} download>
                                      <Download className="w-4 h-4" />
                                      Download Full Video
                                    </a>
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">
                                Final video not available yet
                              </p>
                            </div>
                          )}
                        </TabsContent>

                        {/* Shorts Tab */}
                        <TabsContent value="shorts" className="space-y-4">
                          {project.shortsFiles.length > 0 ? (
                            <div className="grid gap-4">
                              {project.shortsFiles.map((shortBlob, index) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: no unique id available
                                <div key={`short-${index}`}>
                                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Video className="w-4 h-4 text-primary" />
                                    Short #{index + 1}
                                    {project.shorts[index] && (
                                      <span className="text-xs text-muted-foreground font-normal ml-2">
                                        -{" "}
                                        {project.shorts[index].substring(0, 50)}
                                        ...
                                      </span>
                                    )}
                                  </h4>
                                  <MediaPlayer
                                    src={shortBlob.getDirectURL()}
                                    type="video"
                                    title={`Short ${index + 1}`}
                                  />
                                </div>
                              ))}
                              {project.shortsLink && (
                                <Button
                                  variant="outline"
                                  className="w-full gap-2"
                                  asChild
                                >
                                  <a href={project.shortsLink} download>
                                    <Download className="w-4 h-4" />
                                    Download All Shorts (ZIP)
                                  </a>
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No shorts available yet</p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  </>
                )}

                {/* Metadata */}
                {project.metadata.description && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Description
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {project.metadata.description}
                      </p>
                    </div>
                  </>
                )}

                {/* Tags */}
                {project.metadata.tags.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {project.metadata.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Hook Lines */}
                {project.metadata.hookLines.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold">Hook Lines</h3>
                      <ul className="space-y-2">
                        {project.metadata.hookLines.map((hook) => (
                          <li
                            key={hook}
                            className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2 pl-3"
                          >
                            💡 {hook}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Script Preview */}
                {project.script && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Script Preview
                      </h3>
                      <div className="bg-muted/50 rounded-lg p-4 text-sm max-h-64 overflow-y-auto border border-border">
                        <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                          {project.script}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Shorts Segments Text */}
                {project.shorts.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Shorts Segments
                      </h3>
                      <div className="grid gap-2">
                        {project.shorts.map((short, i) => (
                          <div
                            key={short || `short-${i}`}
                            className="bg-muted/50 rounded-lg p-3 border border-border"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-primary mt-0.5">
                                #{i + 1}
                              </span>
                              <p className="text-sm text-muted-foreground flex-1">
                                {short}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Project not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
