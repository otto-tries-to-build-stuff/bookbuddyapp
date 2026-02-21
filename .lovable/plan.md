

# 📚 BookMind – AI-Powered Book Revision App

A clean, minimal learning companion that helps you retain knowledge from books you've read.

## Page 1: My Library

- A clean homepage showing your book collection as cards
- Each card displays the book title, author, and a brief AI-generated summary
- "Add Book" button opens a simple form where you enter a book title and author
- AI automatically generates a summary and key learnings for each book
- Key learnings displayed as bullet points on each book's detail view
- Ability to remove books from your library

## Page 2: Book Detail View

- Full AI-generated summary of the book
- List of key takeaways / learnings
- Clean, readable typography with plenty of whitespace

## Page 3: Chat – Ask About Your Books

- Conversational chat interface powered by AI
- The AI has context about all the books in your library
- Ask open-ended questions like "What did Atomic Habits say about habit stacking?" or "Compare the leadership ideas from two of my books"
- Streaming responses for a natural chat feel
- Chat history within the session

## Backend (Lovable Cloud)

- **Database** to store your book library (titles, authors, summaries, key learnings)
- **Edge functions** for AI-powered features:
  - Generate book summaries and key learnings when a book is added
  - Chat endpoint that includes your library context for relevant answers
- Uses **Lovable AI** (no API keys needed from you)

## Design

- Clean, minimal aesthetic with a focus on readability
- Neutral color palette with subtle accents
- Card-based layout for the library
- Simple, distraction-free chat interface

