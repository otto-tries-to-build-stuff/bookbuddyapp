import { Link } from "react-router-dom";
import { BookOpen, MessageCircle, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { fetchProfile } from "@/lib/api";
import homescreenBook from "@/assets/homescreen-book.png";

const Home = () => {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile
  });

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Profile avatar */}
      <Link to="/profile" className="absolute right-4 top-4">
        <Avatar className="h-9 w-9 border border-border">
          {profile?.avatar_url ?
          <AvatarImage src={profile.avatar_url} alt="Profile" /> :
          null}
          <AvatarFallback className="bg-secondary text-muted-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </Link>
      {/* Book image */}
      <div className="mb-8 h-64 w-64 sm:h-72 sm:w-72">
        <img

          alt="Book"
          className="h-full w-full object-contain" src="/lovable-uploads/56195569-8c38-43f8-bec7-173d30014769.png" />

      </div>

      {/* Title */}
      <h1 className="mb-2 text-4xl font-bold text-foreground sm:text-5xl font-sans">
        BookBuddy
      </h1>
      <p className="mb-10 text-center text-muted-foreground">
        
Your AI-powered reading companion
      </p>

      {/* Navigation buttons */}
      <div className="flex w-full max-w-xs flex-col gap-4">
        <Button asChild size="lg" className="h-14 text-lg">
          <Link to="/library">
            <BookOpen className="mr-2 h-5 w-5" />
            Your Library
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="h-14 text-lg">
          <Link to="/chat">
            <MessageCircle className="mr-2 h-5 w-5" />
            Chat with your books
          </Link>
        </Button>
      </div>
    </div>);
};

export default Home;