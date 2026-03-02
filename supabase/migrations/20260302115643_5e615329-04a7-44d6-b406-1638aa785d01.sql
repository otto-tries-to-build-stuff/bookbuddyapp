
-- Add user_id to books
ALTER TABLE public.books ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to chats
ALTER TABLE public.chats ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to chat_messages (inherit from chat's user)
ALTER TABLE public.chat_messages ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Link profile.id to auth.users
ALTER TABLE public.profile ADD COLUMN user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profile (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Drop old public RLS policies on books
DROP POLICY IF EXISTS "Anyone can delete books" ON public.books;
DROP POLICY IF EXISTS "Anyone can insert books" ON public.books;
DROP POLICY IF EXISTS "Anyone can read books" ON public.books;
DROP POLICY IF EXISTS "Anyone can update books" ON public.books;

-- New user-scoped policies for books
CREATE POLICY "Users can read own books" ON public.books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own books" ON public.books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own books" ON public.books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own books" ON public.books FOR DELETE USING (auth.uid() = user_id);

-- Drop old public RLS policies on chats
DROP POLICY IF EXISTS "Anyone can delete chats" ON public.chats;
DROP POLICY IF EXISTS "Anyone can insert chats" ON public.chats;
DROP POLICY IF EXISTS "Anyone can read chats" ON public.chats;
DROP POLICY IF EXISTS "Anyone can update chats" ON public.chats;

-- New user-scoped policies for chats
CREATE POLICY "Users can read own chats" ON public.chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chats" ON public.chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chats" ON public.chats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chats" ON public.chats FOR DELETE USING (auth.uid() = user_id);

-- Drop old public RLS policies on chat_messages
DROP POLICY IF EXISTS "Anyone can insert chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can read chat_messages" ON public.chat_messages;

-- New user-scoped policies for chat_messages
CREATE POLICY "Users can read own chat_messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat_messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Drop old public RLS policies on profile
DROP POLICY IF EXISTS "Anyone can insert profile" ON public.profile;
DROP POLICY IF EXISTS "Anyone can update profile" ON public.profile;
DROP POLICY IF EXISTS "Anyone can view profile" ON public.profile;

-- New user-scoped policies for profile
CREATE POLICY "Users can view own profile" ON public.profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profile FOR INSERT WITH CHECK (auth.uid() = user_id);
