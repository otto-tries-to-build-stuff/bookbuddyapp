import { useState, useRef } from "react";
import bookmindLogo from "@/assets/bookmind-logo.png";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Loader2, Save, User } from "lucide-react";
import { fetchProfile, updateProfile, uploadAvatar, type Profile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const ProfilePage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile
  });

  const [name, setName] = useState<string | null>(null);
  const displayName = name ?? profile?.name ?? "";

  const updateMutation = useMutation({
    mutationFn: (data: {name?: string;avatar_url?: string;}) =>
    updateProfile(profile!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile updated" });
    },
    onError: (e) =>
    toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadAvatar(file);
      await updateProfile(profile!.id, { avatar_url: url });
      return url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Avatar updated" });
    },
    onError: (e) =>
    toast({ title: "Upload failed", description: e.message, variant: "destructive" })
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
  };

  const handleSaveName = () => {
    if (displayName.trim() && profile) {
      updateMutation.mutate({ name: displayName.trim() });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            to="/"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary">

            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <img src={bookmindLogo} alt="BookMind" className="h-5 w-5" />
            <span className="text-sm text-muted-foreground">BookBuddy</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-16 pt-8 sm:px-6">
        <h1 className="mb-8 text-3xl">Your profile</h1>

        {/* Avatar */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="h-28 w-28 border-2 border-border">
              {profile?.avatar_url ?
              <AvatarImage src={profile.avatar_url} alt="Profile avatar" /> :
              null}
              <AvatarFallback className="bg-secondary text-muted-foreground">
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarMutation.isPending}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">

              {avatarMutation.isPending ?
              <Loader2 className="h-4 w-4 animate-spin" /> :

              <Camera className="h-4 w-4" />
              }
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden" />

          </div>
          {profile?.name &&
          <p className="text-lg font-medium text-foreground">{profile.name}</p>
          }
        </div>

        {/* Name */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setName(e.target.value)} />

          </div>
          <Button
            onClick={handleSaveName}
            disabled={
            updateMutation.isPending ||
            !displayName.trim() ||
            displayName.trim() === profile?.name
            }
            className="w-full gap-2">

            {updateMutation.isPending ?
            <Loader2 className="h-4 w-4 animate-spin" /> :

            <Save className="h-4 w-4" />
            }
            Save
          </Button>
        </div>
      </main>
    </div>);

};

export default ProfilePage;