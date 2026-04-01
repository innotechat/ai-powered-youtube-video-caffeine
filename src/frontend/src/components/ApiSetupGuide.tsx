import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  FileText,
  Mic,
  Music,
  Settings,
  Sparkles,
  Video,
  Zap,
} from "lucide-react";
import type React from "react";

export default function ApiSetupGuide() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                Ready to Create Videos!
              </CardTitle>
              <CardDescription className="text-base">
                All features are active and working with free public APIs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="border-success/50 bg-success/5">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <AlertDescription className="text-base">
              <strong>No setup required!</strong> Start creating AI-powered
              YouTube videos immediately. The app uses free public APIs and
              works out of the box.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Active Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Active Features
          </CardTitle>
          <CardDescription>
            All features are fully functional using free public APIs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon={<FileText className="h-5 w-5" />}
              title="AI Script Generation"
              description="Hugging Face free tier for intelligent script writing"
              status="active"
            />
            <FeatureCard
              icon={<Mic className="h-5 w-5" />}
              title="Natural Voice Narration"
              description="4-tier TTS fallback system (HF → Edge → gTTS → Local)"
              status="active"
            />
            <FeatureCard
              icon={<Video className="h-5 w-5" />}
              title="HD Video Clips"
              description="Pexels public library with thousands of clips"
              status="active"
            />
            <FeatureCard
              icon={<Music className="h-5 w-5" />}
              title="Royalty-Free Music"
              description="Pixabay audio library for background tracks"
              status="active"
            />
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            The app uses a combination of free public APIs and services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <ProcessStep
              number={1}
              title="Script Generation"
              description="Uses Hugging Face's free inference API to generate engaging video scripts based on your niche and trending data"
            />
            <ProcessStep
              number={2}
              title="Voice Narration"
              description="Four-tier TTS system tries Hugging Face first, then falls back to Edge TTS, Google TTS, and finally local Python TTS for maximum reliability"
            />
            <ProcessStep
              number={3}
              title="Video Assembly"
              description="Fetches HD video clips from Pexels public library and combines them with your narration and background music"
            />
            <ProcessStep
              number={4}
              title="Final Production"
              description="Automatically creates subtitles, generates YouTube Shorts, and provides downloadable video files"
            />
          </div>
        </CardContent>
      </Card>

      {/* Optional Enhancement */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            Optional: Add Your API Keys
          </CardTitle>
          <CardDescription>
            Enhance features with your own API keys (completely optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Note:</strong> The app works perfectly without any API
              keys. Adding your own keys provides higher rate limits and
              priority access to services.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <h4 className="mb-2 font-semibold">Hugging Face API Key</h4>
              <p className="mb-3 text-sm text-muted-foreground">
                For enhanced AI script generation and primary TTS with higher
                rate limits
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-medium">How to configure:</p>
                <ol className="ml-4 list-decimal space-y-1 text-muted-foreground">
                  <li>
                    Get your free API key at{" "}
                    <a
                      href="https://huggingface.co/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      huggingface.co/settings/tokens
                    </a>
                  </li>
                  <li>
                    Open{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      frontend/.env.local
                    </code>{" "}
                    in any text editor
                  </li>
                  <li>
                    Replace the empty value:{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      VITE_HUGGINGFACE_API_KEY=your_key_here
                    </code>
                  </li>
                  <li>Save the file and restart the development server</li>
                </ol>
              </div>
              <Alert className="mt-3 border-primary/30 bg-primary/5">
                <AlertDescription className="text-xs">
                  <strong>Security:</strong> The <code>.env.local</code> file is
                  excluded from version control and is safe to edit. API keys
                  are handled securely by the backend and never exposed in the
                  browser.
                </AlertDescription>
              </Alert>
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <h4 className="mb-2 font-semibold">
                Other API Keys (Backend Only)
              </h4>
              <p className="text-sm text-muted-foreground">
                YouTube, Pexels, FreeSound, and other API keys are configured in
                the backend deployment environment using{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  Prim.envVar&lt;system&gt;()
                </code>
                . See{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  .env.local.example
                </code>{" "}
                for details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: "active" | "optional";
}

function FeatureCard({ icon, title, description, status }: FeatureCardProps) {
  return (
    <div className="flex gap-3 rounded-lg border border-border/50 bg-card p-4">
      <div className="flex-shrink-0 rounded-full bg-primary/10 p-2 text-primary">
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">{title}</h4>
          <Badge
            variant={status === "active" ? "default" : "secondary"}
            className="text-xs"
          >
            {status === "active" ? "Active" : "Optional"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
}

function ProcessStep({ number, title, description }: ProcessStepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
        {number}
      </div>
      <div className="flex-1 space-y-1 pt-0.5">
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
