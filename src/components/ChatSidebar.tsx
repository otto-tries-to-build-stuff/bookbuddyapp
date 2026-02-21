import { useState } from "react";
import { Plus, Trash2, RotateCcw, MessageSquare, Archive, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchChats,
  fetchTrashedChats,
  softDeleteChat,
  restoreChat,
  permanentlyDeleteChat,
  type Chat,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ChatSidebarProps {
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

type Tab = "history" | "trash";

export default function ChatSidebar({ activeChatId, onSelectChat, onNewChat }: ChatSidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("history");

  const { data: chats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: fetchChats,
  });

  const { data: trashedChats = [], isLoading: trashLoading } = useQuery({
    queryKey: ["chats-trash"],
    queryFn: fetchTrashedChats,
  });

  const trashMutation = useMutation({
    mutationFn: softDeleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["chats-trash"] });
      toast({ title: "Chat moved to bin" });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["chats-trash"] });
      toast({ title: "Chat restored" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: permanentlyDeleteChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats-trash"] });
      toast({ title: "Chat permanently deleted" });
    },
  });

  const isLoading = tab === "history" ? chatsLoading : trashLoading;
  const items = tab === "history" ? chats : trashedChats;

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar-background">
      {/* New chat button */}
      <div className="shrink-0 p-3">
        <Button onClick={onNewChat} variant="outline" size="sm" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 border-b border-border">
        <button
          onClick={() => setTab("history")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
            tab === "history"
              ? "border-b-2 border-accent text-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          History
        </button>
        <button
          onClick={() => setTab("trash")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
            tab === "trash"
              ? "border-b-2 border-accent text-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Archive className="h-3.5 w-3.5" />
          Bin {trashedChats.length > 0 && `(${trashedChats.length})`}
        </button>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              {tab === "history" ? "No chats yet" : "Bin is empty"}
            </p>
          ) : (
            items.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                tab={tab}
                onSelect={() => tab === "history" && onSelectChat(chat.id)}
                onTrash={() => trashMutation.mutate(chat.id)}
                onRestore={() => restoreMutation.mutate(chat.id)}
                onDelete={() => deleteMutation.mutate(chat.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ChatItem({
  chat,
  isActive,
  tab,
  onSelect,
  onTrash,
  onRestore,
  onDelete,
}: {
  chat: Chat;
  isActive: boolean;
  tab: Tab;
  onSelect: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        tab === "history" && "cursor-pointer",
        isActive ? "bg-accent/10 text-accent" : "text-foreground hover:bg-secondary"
      )}
    >
      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">{chat.title}</span>
      <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {tab === "history" ? (
          <button
            onClick={(e) => { e.stopPropagation(); onTrash(); }}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Move to bin"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onRestore(); }}
              className="rounded p-1 text-muted-foreground hover:bg-accent/10 hover:text-accent"
              title="Restore"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Delete permanently"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
