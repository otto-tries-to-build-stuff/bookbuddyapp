

## Add "Chat about this book" button to Book Detail page

Add a button in the BookDetail header (next to the delete button) that navigates to the Chat page with this book pre-selected as context.

### Changes

**`src/pages/BookDetail.tsx`**
- Add a `MessageSquare` icon button in the header bar (between the back arrow and delete button)
- The button links to `/chat?bookId={book.id}`, passing the current book's ID as a query parameter
- Tooltip: "Chat about this book"

**`src/pages/Chat.tsx`**
- On mount, read the `bookId` query parameter from the URL using `useSearchParams`
- If present, auto-select that book in the book context badges (pre-toggle it in the selected books state)
- Clear the query param after processing so it doesn't persist on refresh

This way users can jump straight from a book summary into a chat conversation with that book already selected as context.

