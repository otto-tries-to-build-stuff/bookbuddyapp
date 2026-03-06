import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, MessageSquarePlus, Send } from "lucide-react";
import { submitFeedback } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Category = "bug" | "suggestion" | "general";

const FeedbackForm = () => {
  const { toast } = useToast();
  const [category, setCategory] = useState<Category>("general");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: () => submitFeedback(message.trim(), category),
    onSuccess: () => {
      toast({ title: "Thanks for your feedback!" });
      setMessage("");
      setCategory("general");
    },
    onError: (e) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="mt-8 space-y-4 border-t border-border pt-6">
      <div className="flex items-center gap-2">
        <MessageSquarePlus className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-medium text-foreground font-sans">
          Send feedback
        </h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-category">Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
          <SelectTrigger id="feedback-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bug">Bug report</SelectItem>
            <SelectItem value="suggestion">Suggestion</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback-message">Message</Label>
        <Textarea
          id="feedback-message"
          placeholder="Tell us what's on your mind…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          rows={4}
        />
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !message.trim()}
        className="w-full gap-2"
      >
        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Submit feedback
      </Button>
    </div>
  );
};

export default FeedbackForm;
