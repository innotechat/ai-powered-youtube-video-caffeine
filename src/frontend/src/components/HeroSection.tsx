import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileVideo, Music, Sparkles, Video, Wand2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function HeroSection() {
  const { login, loginStatus } = useInternetIdentity();

  const features = [
    {
      icon: Wand2,
      title: "AI Script Generation",
      description: "Generate engaging YouTube scripts optimized for your niche",
    },
    {
      icon: Music,
      title: "Audio Production",
      description: "Professional TTS narration with background music",
    },
    {
      icon: FileVideo,
      title: "Video Assembly",
      description: "Automatic video editing with clips, subtitles, and effects",
    },
    {
      icon: Sparkles,
      title: "Shorts Creation",
      description: "Extract best moments for YouTube Shorts automatically",
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 -z-10" />

      {/* Hero Content */}
      <div className="container py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Hero Image */}
          <div className="relative w-full max-w-3xl mx-auto mb-8">
            <img
              src="/assets/generated/dashboard-hero.dim_1200x800.png"
              alt="AI Video Creation Dashboard"
              className="rounded-2xl shadow-2xl border border-border/50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent rounded-2xl" />
          </div>

          {/* Hero Text */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Create YouTube Videos with{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Power
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Automate your YouTube content creation from script to final video.
              Generate engaging videos in minutes, not hours.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={login}
              disabled={loginStatus === "logging-in"}
              className="text-lg px-8 py-6 rounded-full gap-2"
            >
              <Video className="w-5 h-5" />
              {loginStatus === "logging-in"
                ? "Connecting..."
                : "Get Started Free"}
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-border/50 bg-card/50 backdrop-blur"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Process Steps */}
          <div className="mt-16 pt-16 border-t border-border/50">
            <h2 className="text-2xl font-bold mb-8">How It Works</h2>
            <div className="relative max-w-2xl mx-auto">
              <img
                src="/assets/generated/progress-steps.dim_600x200.png"
                alt="Video Creation Process"
                className="rounded-lg border border-border/50"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 max-w-3xl mx-auto">
              {[
                "Script Generation",
                "Audio Production",
                "Video Assembly",
                "Download & Share",
              ].map((step, i) => (
                <div key={step} className="text-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-2">
                    {i + 1}
                  </div>
                  <p className="text-sm font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
