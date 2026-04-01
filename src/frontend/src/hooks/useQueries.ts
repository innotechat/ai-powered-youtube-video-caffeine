import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AudioBlob,
  DownloadLink,
  FileContent,
  FileSaveResult,
  FileTreeNode,
  Metadata,
  MusicTrack,
  NarrationText,
  Niche,
  PartialProject,
  ProjectStatus,
  Script,
  Segment,
  Subtitle,
  TtsLogEntry,
  TtsService,
  Variant_started_error_success,
  VideoClip,
  VideoLength,
} from "../backend";
import type { ExternalBlob } from "../backend";
import { useActor } from "./useActor";

// Query: Get all projects (using paged query with large page size)
export function useGetAllProjects() {
  const { actor, isFetching } = useActor();

  return useQuery<PartialProject[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      if (!actor) return [];
      // Fetch first 1000 projects (effectively all projects for most users)
      return actor.getPagedProjects(BigInt(1000), BigInt(0));
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: 1000,
  });
}

// Query: Get single project by fetching all and filtering
export function useGetProject(projectId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<PartialProject | null>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!actor || !projectId) return null;
      try {
        // Fetch all projects and find the one we need
        const projects = await actor.getPagedProjects(BigInt(1000), BigInt(0));
        const project = projects.find((p) => p.projectId === projectId);
        return project || null;
      } catch (error) {
        console.error("Failed to fetch project:", error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !!projectId,
    refetchInterval: (query) => {
      const project = query.state.data;
      // Poll every 2 seconds if project is in progress
      if (
        project &&
        ["scripting", "audioRendering", "videoMerging", "finalizing"].includes(
          project.status,
        )
      ) {
        return 2000;
      }
      return false;
    },
    retry: 2,
    retryDelay: 1000,
  });
}

// Mutation: Create project
export function useCreateProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      length,
      niche,
    }: { length: VideoLength; niche: Niche }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createProject(length, niche);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      console.error("Failed to create project:", error);
    },
  });
}

// Mutation: Delete project
export function useDeleteProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteProject(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      console.error("Failed to delete project:", error);
    },
  });
}

// Mutation: Update script
export function useUpdateScript() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      script,
      metadata,
      narration,
    }: {
      projectId: string;
      script: Script;
      metadata: Metadata;
      narration: NarrationText;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateScript(projectId, script, metadata, narration);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: ["projectStatus", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["projectProgress", variables.projectId],
      });
    },
    onError: (error) => {
      console.error("Failed to update script:", error);
    },
  });
}

// Mutation: Update audio
export function useUpdateAudio() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      audio,
      music,
    }: {
      projectId: string;
      audio: AudioBlob;
      music: MusicTrack;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateAudio(projectId, audio, music);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: ["projectStatus", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["projectProgress", variables.projectId],
      });
    },
    onError: (error) => {
      console.error("Failed to update audio:", error);
    },
  });
}

// Mutation: Update videos
export function useUpdateVideos() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      videos,
      subtitles,
    }: {
      projectId: string;
      videos: VideoClip[];
      subtitles: Subtitle[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateVideos(projectId, videos, subtitles);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: ["projectStatus", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["projectProgress", variables.projectId],
      });
    },
    onError: (error) => {
      console.error("Failed to update videos:", error);
    },
  });
}

// Mutation: Finalize project
export function useFinalizeProject() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      fullVideoLink,
      shortsLink,
      shorts,
      originalVideo,
      shortsFiles,
    }: {
      projectId: string;
      fullVideoLink: DownloadLink;
      shortsLink: DownloadLink;
      shorts: Segment[];
      originalVideo: ExternalBlob;
      shortsFiles: ExternalBlob[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.finalizeProject(
        projectId,
        fullVideoLink,
        shortsLink,
        shorts,
        originalVideo,
        shortsFiles,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: ["projectStatus", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["projectProgress", variables.projectId],
      });
    },
    onError: (error) => {
      console.error("Failed to finalize project:", error);
    },
  });
}

// Query: Get project status
export function useGetProjectStatus(projectId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<ProjectStatus | null>({
    queryKey: ["projectStatus", projectId],
    queryFn: async () => {
      if (!actor || !projectId) return null;
      try {
        return await actor.getProjectStatus(projectId);
      } catch (error) {
        console.error("Failed to fetch project status:", error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!projectId,
    refetchInterval: 2000, // Poll every 2 seconds for status updates
    retry: 1,
  });
}

// Query: Get progress percentage
export function useGetProgressPercentage(projectId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint | null>({
    queryKey: ["projectProgress", projectId],
    queryFn: async () => {
      if (!actor || !projectId) return null;
      try {
        return await actor.getProgressPercentage(projectId);
      } catch (error) {
        console.error("Failed to fetch project progress:", error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!projectId,
    refetchInterval: 2000, // Poll every 2 seconds
    retry: 1,
  });
}

// Mutation: Handle API error
export function useHandleApiError() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      errorMessage,
    }: { projectId: string; errorMessage: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.handleApiError(projectId, errorMessage);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({
        queryKey: ["projectStatus", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["projectProgress", variables.projectId],
      });
    },
    onError: (error) => {
      console.error("Failed to handle API error:", error);
    },
  });
}

// Mutation: Log TTS event
export function useLogTtsEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ttsService,
      status,
      message,
      errorCode,
      mp3Generated,
      audioUrl,
      integrityConfirmed,
    }: {
      ttsService: TtsService;
      status: Variant_started_error_success;
      message: string;
      errorCode: bigint | null;
      mp3Generated: boolean;
      audioUrl: string | null;
      integrityConfirmed: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.logTtsEvent(
        ttsService,
        status,
        message,
        errorCode,
        mp3Generated,
        audioUrl,
        integrityConfirmed,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ttsLogs"] });
    },
    onError: (error) => {
      console.error("Failed to log TTS event:", error);
    },
  });
}

// Query: Get all TTS logs
export function useGetAllTtsLogs() {
  const { actor, isFetching } = useActor();

  return useQuery<TtsLogEntry[]>({
    queryKey: ["ttsLogs"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllTtsLogs();
      } catch (error) {
        console.error("Failed to fetch TTS logs:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000, // Poll every 3 seconds for real-time updates
    retry: 1,
  });
}

// Query: Get TTS logs by service
export function useGetTtsLogsByService(service: TtsService | null) {
  const { actor, isFetching } = useActor();

  return useQuery<TtsLogEntry[]>({
    queryKey: ["ttsLogs", service],
    queryFn: async () => {
      if (!actor || !service) return [];
      try {
        return await actor.getTtsLogsByService(service);
      } catch (error) {
        console.error("Failed to fetch TTS logs by service:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!service,
    refetchInterval: 3000,
    retry: 1,
  });
}

// File Management Queries and Mutations

// Query: Get file tree
export function useGetFileTree(rootPath: string) {
  const { actor, isFetching } = useActor();

  return useQuery<FileTreeNode[]>({
    queryKey: ["fileTree", rootPath],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getFileTree(rootPath);
      } catch (error) {
        console.error("Failed to fetch file tree:", error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}

// Mutation: Read file
export function useReadFile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (path: string): Promise<FileContent | null> => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.readFile(path);
      } catch (error) {
        console.error("Failed to read file:", error);
        throw error;
      }
    },
  });
}

// Mutation: Save file
export function useSaveFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      path,
      content,
    }: { path: string; content: string }): Promise<FileSaveResult> => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.saveFile(path, content);
      } catch (error) {
        console.error("Failed to save file:", error);
        throw error;
      }
    },
    onSuccess: (result) => {
      // Invalidate file tree to reflect any changes
      queryClient.invalidateQueries({ queryKey: ["fileTree"] });

      // If .env.local was updated, log it
      if (result.path.includes(".env.local")) {
        console.log("Environment file updated:", result.path);
      }
    },
  });
}

// Query: Get file metadata
export function useGetFileMetadata(path: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["fileMetadata", path],
    queryFn: async () => {
      if (!actor || !path) return null;
      try {
        return await actor.getFileMetadata(path);
      } catch (error) {
        console.error("Failed to fetch file metadata:", error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!path,
    retry: 1,
  });
}

// Mutation: Validate environment file
export function useValidateEnvFile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (content: string): Promise<boolean> => {
      if (!actor) throw new Error("Actor not available");
      try {
        return await actor.validateEnvFile(content);
      } catch (error) {
        console.error("Failed to validate environment file:", error);
        throw error;
      }
    },
  });
}
