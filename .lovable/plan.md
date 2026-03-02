

## Remove Home Page and Update Library as Default

### Changes

**1. Update routing (`src/App.tsx`)**
- Change the `/` route to render `Index` (library) instead of `Home`
- Remove the `/library` route (library is now at `/`)
- Remove the `Home` import
- Keep all other routes unchanged

**2. Update library page header (`src/pages/Index.tsx`)**
- Replace the back arrow (`ArrowLeft` link to `/`) with a profile avatar button (link to `/profile`)
- Use the same `Avatar` component pattern from the current Home page
- Fetch the user profile with `useQuery` to show the avatar image
- Import `Avatar`, `AvatarImage`, `AvatarFallback` from UI components, `User` icon, and `fetchProfile` from api

**3. Update navigation links across the app**
- `src/pages/BookDetail.tsx`: Update back link from `/library` to `/`
- `src/pages/Chat.tsx` / `src/components/ChatSidebar.tsx`: Update any links pointing to `/library` to `/`
- Any other references to `/library` route

**4. Clean up**
- Delete `src/pages/Home.tsx` (no longer needed)

