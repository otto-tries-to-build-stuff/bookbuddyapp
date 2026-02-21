
-- Chat conversations
CREATE TABLE public.chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Public access policies (matching existing books pattern)
CREATE POLICY "Anyone can read chats" ON public.chats FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chats" ON public.chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update chats" ON public.chats FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete chats" ON public.chats FOR DELETE USING (true);

CREATE POLICY "Anyone can read chat_messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chat_messages" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX idx_chats_deleted_at ON public.chats(deleted_at);

-- Trigger for updated_at
CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
