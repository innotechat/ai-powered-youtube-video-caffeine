import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Download,
  Maximize2,
  Pause,
  Play,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SiGoogledrive } from "react-icons/si";
import { toast } from "sonner";

interface MediaPlayerProps {
  src: string;
  type: "audio" | "video";
  title?: string;
  className?: string;
}

export default function MediaPlayer({
  src,
  type,
  title,
  className = "",
}: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const [mediaSrc, setMediaSrc] = useState(src);

  // Reload media when src changes
  useEffect(() => {
    console.log("[MediaPlayer] Source changed, reloading media:", src);
    setMediaSrc(src);
    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    setIsPlaying(false);
    setCurrentTime(0);

    // Force reload the media element
    if (mediaRef.current) {
      mediaRef.current.load();
    }
  }, [src]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleLoadedMetadata = () => {
      console.log(
        "[MediaPlayer] Media loaded successfully, duration:",
        media.duration,
      );
      setDuration(media.duration);
      setIsLoading(false);
      setHasError(false);

      // Auto-play newly loaded media
      if (media.paused) {
        media
          .play()
          .then(() => {
            setIsPlaying(true);
            console.log("[MediaPlayer] Auto-playing newly loaded media");
          })
          .catch((err) => {
            console.warn("[MediaPlayer] Auto-play prevented:", err);
          });
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      setIsLoading(false);
      setHasError(true);

      const target = e.target as HTMLMediaElement;
      const error = target.error;

      let errorMsg = "Failed to load media";
      if (error) {
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMsg = "Media loading aborted";
            break;
          case error.MEDIA_ERR_NETWORK:
            errorMsg = "Network error while loading media";
            break;
          case error.MEDIA_ERR_DECODE:
            errorMsg = "Media decoding error";
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = "Media format not supported or URL invalid";
            break;
          default:
            errorMsg = error.message || "Unknown media error";
        }
      }

      console.error("[MediaPlayer] Media error:", errorMsg, "URL:", mediaSrc);
      setErrorMessage(errorMsg);

      toast.error("Failed to load media", {
        description: `${errorMsg}. URL: ${mediaSrc.substring(0, 50)}...`,
      });
    };

    const handleCanPlay = () => {
      console.log("[MediaPlayer] Media can play");
      setIsLoading(false);
    };

    media.addEventListener("loadedmetadata", handleLoadedMetadata);
    media.addEventListener("timeupdate", handleTimeUpdate);
    media.addEventListener("ended", handleEnded);
    media.addEventListener("error", handleError);
    media.addEventListener("canplay", handleCanPlay);

    return () => {
      media.removeEventListener("loadedmetadata", handleLoadedMetadata);
      media.removeEventListener("timeupdate", handleTimeUpdate);
      media.removeEventListener("ended", handleEnded);
      media.removeEventListener("error", handleError);
      media.removeEventListener("canplay", handleCanPlay);
    };
  }, [mediaSrc]);

  const handleReload = () => {
    console.log("[MediaPlayer] Manual reload requested");
    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    setIsPlaying(false);

    if (mediaRef.current) {
      mediaRef.current.load();
    }
  };

  const togglePlayPause = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play().catch((err) => {
        console.error("[MediaPlayer] Play error:", err);
        toast.error("Playback failed", {
          description: "Could not play the media. Please try reloading.",
        });
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const media = mediaRef.current;
    if (!media) return;

    const newTime = value[0];
    media.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const media = mediaRef.current;
    if (!media) return;

    const newVolume = value[0];
    media.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isMuted) {
      media.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      media.volume = 0;
      setIsMuted(true);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        title || `media-${Date.now()}.${type === "video" ? "mp4" : "mp3"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Download started", {
        description: "Your file is being downloaded.",
      });
    } catch (error) {
      console.error("[MediaPlayer] Download failed:", error);
      toast.error("Download failed", {
        description: "Could not download the file. Please try again.",
      });
    }
  };

  const handleSaveToGoogleDrive = () => {
    // Open Google Drive picker/saver
    const driveUrl = "https://drive.google.com/drive/u/0/";
    window.open(driveUrl, "_blank");
    toast.info("Opening Google Drive", {
      description: "You can manually upload the file after downloading it.",
    });
  };

  const toggleFullscreen = () => {
    const media = mediaRef.current;
    if (!media || type !== "video") return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      media.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    if (Number.isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`bg-muted/50 rounded-lg border border-border overflow-hidden ${className}`}
    >
      {/* Media Element */}
      <div className="relative bg-black">
        {type === "video" ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={mediaSrc}
            className="w-full aspect-video"
            playsInline
          >
            <track kind="captions" />
          </video>
        ) : (
          <div className="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="text-center">
              <Volume2 className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
              <p className="text-sm text-muted-foreground">
                {title || "Audio Track"}
              </p>
            </div>
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={mediaSrc}
            >
              <track kind="captions" />
            </audio>
          </div>
        )}

        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2" />
              <p className="text-xs text-white">Loading media...</p>
            </div>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center p-4">
              <p className="text-red-500 font-medium mb-2">Media Load Error</p>
              <p className="text-xs text-white mb-3">{errorMessage}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReload}
                className="gap-2"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 space-y-3">
        {/* Timeline */}
        <div className="space-y-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
            disabled={hasError}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <Button
            size="sm"
            variant="outline"
            onClick={togglePlayPause}
            disabled={isLoading || hasError}
            className="gap-2"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isPlaying ? "Pause" : "Play"}
          </Button>

          {/* Reload */}
          {hasError && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleReload}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload
            </Button>
          )}

          {/* Volume Control */}
          <div className="flex items-center gap-2 flex-1 max-w-32">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              className="shrink-0"
              disabled={hasError}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="cursor-pointer"
              disabled={hasError}
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Fullscreen (video only) */}
          {type === "video" && (
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleFullscreen}
              title="Fullscreen"
              disabled={hasError}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          )}

          {/* Download */}
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDownload}
            title="Download"
            disabled={hasError}
          >
            <Download className="w-4 h-4" />
          </Button>

          {/* Save to Google Drive */}
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSaveToGoogleDrive}
            title="Save to Google Drive"
            disabled={hasError}
          >
            <SiGoogledrive className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
