/**
 * Profile.tsx — User Profile & Settings
 *
 * This page lets users manage their account:
 * - View and change their avatar (profile picture)
 * - Update their display name
 * - Change their password
 * - Toggle dark/light mode
 * - Sign out
 *
 * Key concepts:
 * - useRef: Creates a reference to the hidden file input so we can
 *   trigger the file picker programmatically (by clicking the camera button)
 * - useMutation: Handles async save operations with loading/error states
 * - useTheme: From next-themes, manages dark/light mode preference
 */

import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Info, Loader2, LogOut, Moon, Save, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { fetchProfile, updateProfile, uploadAvatar, type Profile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const ProfilePage = () => {
  const { toast } = useToast();
  const { user, signOut, updatePassword } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const queryClient = useQueryClient();

  // Hidden file input — we click it programmatically when the camera button is pressed
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch the user's profile from the database
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile
  });

  // Name editing — null means "use the value from the database"
  const [name, setName] = useState<string | null>(null);
  const displayName = name ?? profile?.name ?? "";

  // Mutation to update the profile name
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

  // Mutation to upload a new avatar image
  // This is a two-step process: upload the file, then update the profile URL
  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadAvatar(file);           // Upload to storage
      await updateProfile(profile!.id, { avatar_url: url }); // Save URL to profile
      return url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Avatar updated" });
    },
    onError: (e) =>
    toast({ title: "Upload failed", description: e.message, variant: "destructive" })
  });

  // Handle file selection from the hidden input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
  };

  // Save the display name
  const handleSaveName = () => {
    if (displayName.trim() && profile) {
      updateMutation.mutate({ name: displayName.trim() });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Show loading spinner while fetching profile
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <header className="px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            to="/"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary">

            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-16 pt-8 sm:px-6">
        <h1 className="mb-8 text-3xl font-sans font-medium">Your profile</h1>

        {/* Avatar section — clickable camera button triggers file upload */}
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
            {/* Camera button — triggers the hidden file input */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarMutation.isPending}
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">

              {avatarMutation.isPending ?
              <Loader2 className="h-4 w-4 animate-spin" /> :

              <Camera className="h-4 w-4" />
              }
            </button>
            {/* Hidden file input — opened programmatically by the camera button */}
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
          {user?.email &&
          <p className="text-sm text-muted-foreground">{user.email}</p>
          }
        </div>

        {/* Name input and save button */}
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

        {/* Change password section */}
        <div className="mt-8 space-y-4 border-t border-border pt-6">
          <h2 className="text-lg font-medium text-foreground font-sans">Change password</h2>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} />

          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} />

          </div>
          <Button
            onClick={async () => {
              // Validate password requirements before submitting
              if (newPassword.length < 6) {
                toast({ title: "Password must be at least 6 characters", variant: "destructive" });
                return;
              }
              if (newPassword !== confirmPassword) {
                toast({ title: "Passwords do not match", variant: "destructive" });
                return;
              }
              setPasswordLoading(true);
              const { error } = await updatePassword(newPassword);
              setPasswordLoading(false);
              if (error) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
              } else {
                toast({ title: "Password updated" });
                setNewPassword("");
                setConfirmPassword("");
              }
            }}
            disabled={passwordLoading || !newPassword || !confirmPassword}
            className="w-full gap-2">

            {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Update password
          </Button>
        </div>

        {/* Appearance: dark mode toggle */}
        <div className="mt-8 border-t border-border pt-6">
          <h2 className="mb-4 text-lg font-medium text-foreground font-sans">Appearance</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {resolvedTheme === "dark" ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="text-sm text-foreground">Dark mode</span>
            </div>
            <Switch
              checked={resolvedTheme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </div>

        {/* About link and sign out button */}
        <div className="mt-8 space-y-3 border-t border-border pt-6">
          <Button variant="outline" className="w-full gap-2" asChild>
            <Link to="/about">
              <Info className="h-4 w-4" />
              About BookBuddy
            </Link>
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </main>
    </div>);

};

export default ProfilePage;
