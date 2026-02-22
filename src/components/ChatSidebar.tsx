import { useState } from "react";
import { Plus, MoreHorizontal, RotateCcw, MessageSquare, Archive, Trash2, Pin, PinOff, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchChats,
  fetchArchivedChats,
  archiveChat,
  restoreChat,
  permanentlyDeleteChat,
  pinChat,
  unpinChat,
  updateChatTitle,
  type Chat,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ChatSidebarProps {
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

type Tab = "history" | "archive";

export default function ChatSidebar({ activeChatId, onSelectChat, onNewChat }: ChatSidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("history");

  const { data: chats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: fetchChats,
  });

  const { data: archivedChats = [], isLoading: archiveLoading } = useQuery({
    queryKey: ["chats-archive"],
    queryFn: fetchArchivedChats,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["chats"] });
    queryClient.invalidateQueries({ queryKey: ["chats-archive"] });
  };

  const archiveMutation = useMutation({
    mutationFn: archiveChat,
    onSuccess: () => { invalidateAll(); toast({ title: "Chat archived" }); },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreChat,
    onSuccess: () => { invalidateAll(); toast({ title: "Chat restored" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: permanentlyDeleteChat,
    onSuccess: () => { invalidateAll(); toast({ title: "Chat permanently deleted" }); },
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      pinned ? unpinChat(id) : pinChat(id),
    onSuccess: () => { invalidateAll(); },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => updateChatTitle(id, title),
    onSuccess: () => { invalidateAll(); toast({ title: "Chat renamed" }); },
  });

  const isLoading = tab === "history" ? chatsLoading : archiveLoading;
  const items = tab === "history" ? chats : archivedChats;

  // Sort: pinned first, then by updated_at
  const sortedItems = tab === "history"
    ? [...items].sort((a, b) => {
        if (a.pinned_at && !b.pinned_at) return -1;
        if (!a.pinned_at && b.pinned_at) return 1;
        return 0; // keep original order within groups
      })
    : items;

  return (
    <div className="chat-sidebar flex h-full w-64 flex-col border-r border-border bg-sidebar-background">
      <div className="shrink-0 p-3">
        <Button onClick={onNewChat} variant="outline" size="sm" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

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
          onClick={() => setTab("archive")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
            tab === "archive"
              ? "border-b-2 border-accent text-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Archive className="h-3.5 w-3.5" />
          Archive {archivedChats.length > 0 && `(${archivedChats.length})`}
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : sortedItems.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              {tab === "history" ? "No chats yet" : "Archive is empty"}
            </p>
          ) : (
            sortedItems.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                tab={tab}
                onSelect={() => tab === "history" && onSelectChat(chat.id)}
                onArchive={() => archiveMutation.mutate(chat.id)}
                onRestore={() => restoreMutation.mutate(chat.id)}
                onDelete={() => deleteMutation.mutate(chat.id)}
                onTogglePin={() => pinMutation.mutate({ id: chat.id, pinned: !!chat.pinned_at })}
                onRename={(title) => renameMutation.mutate({ id: chat.id, title })}
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
  onArchive,
  onRestore,
  onDelete,
  onTogglePin,
  onRename,
}: {
  chat: Chat;
  isActive: boolean;
  tab: Tab;
  onSelect: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onRename: (title: string) => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(chat.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== chat.title) {
      onRename(trimmed);
    }
    setIsRenaming(false);
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative flex items-center gap-2 rounded-md px-3 py-2 pr-8 text-sm transition-colors",
        tab === "history" && "cursor-pointer",
        isActive ? "bg-accent/10 text-accent" : "text-foreground hover:bg-secondary"
      )}
    >
      {chat.pinned_at && tab === "history" && (
        <Pin className="h-3 w-3 shrink-0 text-accent" />
      )}
      {!chat.pinned_at && (
        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}

      {isRenaming ? (
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit();
            if (e.key === "Escape") setIsRenaming(false);
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-6 flex-1 text-xs px-1 py-0"
          autoFocus
        />
      ) : (
        <span className="min-w-0 flex-1 truncate">
          {chat.title.length > 20 ? chat.title.slice(0, 20) + "…" : chat.title}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="absolute right-1 top-1/2 -translate-y-1/2 shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-secondary transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {tab === "history" ? (
            <>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(); }}>
                {chat.pinned_at ? <PinOff className="mr-2 h-3.5 w-3.5" /> : <Pin className="mr-2 h-3.5 w-3.5" />}
                {chat.pinned_at ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenameValue(chat.title); setIsRenaming(true); }}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }}>
                <Archive className="mr-2 h-3.5 w-3.5" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRestore(); }}>
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                Restore
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete permanently
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will {tab === "archive" ? "permanently delete" : "delete"} "{chat.title.length > 30 ? chat.title.slice(0, 30) + "…" : chat.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
