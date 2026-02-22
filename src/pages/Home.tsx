import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import homescreenThinking from "@/assets/homescreen-thinking.png";
import homescreenBook from "@/assets/homescreen-book.png";

const images = [homescreenThinking, homescreenBook];

const Home = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Animated image */}
      <div className="relative mb-8 h-48 w-48 sm:h-56 sm:w-56">
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ease-in-out"
            style={{ opacity: activeIndex === i ? 1 : 0 }}
          />
        ))}
      </div>

      {/* Title */}
      <h1 className="mb-2 text-4xl font-bold text-foreground sm:text-5xl">
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
            Chat
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default Home;
