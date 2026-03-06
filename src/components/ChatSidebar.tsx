/**
 * ChatSidebar.tsx — Chat History Sidebar
 *
 * This component shows the list of past chat conversations in a sidebar.
 * It has two tabs:
 * 1. "History" — Active chats (pinned ones appear first)
 * 2. "Archive" — Soft-deleted chats that can be restored
 *
 * Each chat item has a dropdown menu with actions:
 * - Pin/Unpin — Keep important chats at the top
 * - Rename — Change the chat title
 * - Archive — Soft-delete (move to archive tab)
 * - Delete — Permanently remove the chat
 *
 * The sidebar uses React Query to fetch and cache chat data,
 * and mutations to update/delete chats on the server.
 */

import { useState } from "react";
import { Plus, MoreHorizontal, RotateCcw, MessageSquare, Archive, Trash2, Pin, PinOff, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
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

// Props: the parent (Chat page) controls which chat is active and handles navigation
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

  // Fetch active chats from the database
  const { data: chats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: fetchChats,
  });

  // Fetch archived chats separately
  const { data: archivedChats = [], isLoading: archiveLoading } = useQuery({
    queryKey: ["chats-archive"],
    queryFn: fetchArchivedChats,
  });

  // Helper to refresh both chat lists after any change
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["chats"] });
    queryClient.invalidateQueries({ queryKey: ["chats-archive"] });
  };

  // Mutations: each one handles a specific action and refreshes the lists on success
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

  // Determine which list to show based on the selected tab
  const isLoading = tab === "history" ? chatsLoading : archiveLoading;
  const items = tab === "history" ? chats : archivedChats;

  // Sort history: pinned chats float to the top
  const sortedItems = tab === "history"
    ? [...items].sort((a, b) => {
        if (a.pinned_at && !b.pinned_at) return -1;
        if (!a.pinned_at && b.pinned_at) return 1;
        return 0; // Keep original order within each group (pinned vs unpinned)
      })
    : items;

  return (
    <div className="chat-sidebar flex h-full w-64 flex-col border-r border-border bg-sidebar-background">
      {/* New Chat button */}
      <div className="shrink-0 p-3">
        <Button onClick={onNewChat} variant="outline" size="sm" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Tab switcher: History / Archive */}
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

      {/* Chat list */}
      <ScrollArea className="flex-1">
        <TooltipProvider delayDuration={300}>
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
        </TooltipProvider>
      </ScrollArea>
    </div>
  );
}

/**
 * ChatItem — A single chat entry in the sidebar.
 *
 * Shows the chat title with a pin icon (if pinned) and a "..." menu
 * for actions. Also supports inline renaming.
 */
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

  // Submit the rename if the title actually changed
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
        "group grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        tab === "history" && "cursor-pointer",
        isActive ? "bg-accent/10 text-accent" : "text-foreground hover:bg-secondary"
      )}
    >
      {/* Icon: pin icon for pinned chats, message icon for others */}
      {chat.pinned_at && tab === "history" && (
        <Pin className="h-3 w-3 shrink-0 text-accent" />
      )}
      {!chat.pinned_at && (
        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}

      {/* Title: either an editable input (when renaming) or truncated text */}
      {isRenaming ? (
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit();
            if (e.key === "Escape") setIsRenaming(false);
          }}
          onClick={(e) => e.stopPropagation()} // Don't trigger chat selection
          className="h-6 flex-1 text-xs px-1 py-0"
          autoFocus
        />
      ) : (
        <div className="min-w-0 flex-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block truncate">{chat.title}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px] break-words">
              {chat.title}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Actions dropdown menu ("..." button) */}
      <div className="shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {tab === "history" ? (
            <>
              {/* History tab actions: Pin, Rename, Archive, Delete */}
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
              {/* Archive tab actions: Restore, Delete permanently */}
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
      </div>

      {/* Delete confirmation dialog */}
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
