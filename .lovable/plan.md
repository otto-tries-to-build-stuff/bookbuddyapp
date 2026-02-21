
### Overview
I will implement an autocomplete search feature for the "Add Book" dialog. As you type a book title, the app will fetch suggestions from the Open Library API. Selecting a suggestion will automatically fill in both the Title and Author fields, ensuring accuracy and saving you time.

### User Experience
*   When you open the "Add Book" dialog, the "Title" field will now act as a search box.
*   As you type, a dropdown list of matching books (with their authors and covers) will appear.
*   Selecting a book from the list will instantly populate the Title and Author inputs.
*   You can still type manually if the book isn't found in the database.

### Technical Steps
1.  **API Integration**: Add a new function in `src/lib/api.ts` called `searchBooks(query: string)` that calls the Open Library Search API (`https://openlibrary.org/search.json?q=...`).
2.  **Search Logic**:
    *   Implement a debounce in `src/pages/Index.tsx` so we don't spam the API on every single keystroke.
    *   Add state to manage search results and a "searching" loading indicator.
3.  **UI Components**:
    *   Use the existing `Command` and `Popover` components (or a similar dropdown pattern) to display the search results under the Title input.
    *   Update the `addMutation` to use the selected book data.
4.  **Refinement**: Ensure that if a user just wants to type a custom title and press Enter, it still works as it does now (manual entry fallback).

### Impact
*   **Accuracy**: Eliminates typos in titles and authors.
*   **Speed**: Faster than typing everything manually.
*   **Reliability**: Since the API is free and doesn't require keys, there's no risk of it "shutting off" due to cost.
