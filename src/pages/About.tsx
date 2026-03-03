import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, MessageSquare, Brain, Search, UserCircle, Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
"@/components/ui/accordion";

const features = [
{
  icon: BookOpen,
  title: "Build Your Library",
  description:
  "Search for any book and add it to your personal library. BookBuddy pulls in cover art, author info, and details automatically so your collection stays organised."
},
{
  icon: Brain,
  title: "AI-Generated Summaries",
  description:
  "Get concise, AI-powered summaries and key learnings for every book in your library — perfect for quick refreshers or deciding what to read next."
},
{
  icon: MessageSquare,
  title: "Chat About Your Books",
  description:
  "Start a conversation with the AI about any book in your library. Ask questions, explore themes, or get reading recommendations based on what you've read."
},
{
  icon: Search,
  title: "Discover New Books",
  description:
  "Use the search bar to find books by title or author. Browse results, preview details, and add anything that catches your eye."
},
{
  icon: UserCircle,
  title: "Your Profile",
  description:
  "Personalise your account with a name and avatar. You can also update your password from the profile page."
}];


const steps = [
{ step: "1", text: "Sign up and verify your email to create your account." },
{ step: "2", text: "Search for a book using the search bar on the library page." },
{ step: "3", text: "Tap a book to view its details, summary, and key learnings." },
{ step: "4", text: "Open a chat to ask the AI anything about your books." }];


const faqs = [
{
  q: "Is BookBuddy free to use?",
  a: "Yes — you can build your library and chat with the AI at no cost."
},
{
  q: "Where does the book data come from?",
  a: "Book metadata and covers are sourced from the Open Library API."
},
{
  q: "How does the AI chat work?",
  a: "The AI uses the context of the books in your library to answer questions, provide summaries, and suggest connections between ideas."
},
{
  q: "Can I delete a book from my library?",
  a: "Yes — open the book's detail page and use the delete option to remove it."
},
{
  q: "Is my data private?",
  a: "Absolutely. Your library and chat history are tied to your account and are not shared with other users."
}];


interface AboutPageProps {
  backTo?: string;
}

export default function AboutPage({ backTo = "/" }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            to={backTo}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary">
            
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-16 pt-4 sm:px-6">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-sans font-medium text-foreground">About BookBuddy</h1>
          <p className="mt-2 text-muted-foreground">
            Your AI-powered reading companion. Build a personal library, get instant summaries, and chat about your books.
          </p>
        </div>

        {/* Features */}
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-sans font-medium text-foreground">Key Features</h2>
          <Accordion type="multiple" className="w-full">
            {features.map((f, i) =>
            <AccordionItem key={i} value={`feature-${i}`}>
                <AccordionTrigger className="text-left">
                  <span className="flex items-center gap-3">
                    <f.icon className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-sans">{f.title}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pl-8">
                  {f.description}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </section>

        {/* Getting Started */}
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-sans font-medium text-foreground">Getting Started</h2>
          <ol className="space-y-3">
            {steps.map((s) =>
            <li key={s.step} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {s.step}
                </span>
                <span className="pt-0.5 text-sm text-muted-foreground">{s.text}</span>
              </li>
            )}
          </ol>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="mb-3 text-lg font-sans font-medium text-foreground">FAQ</h2>
          <Accordion type="multiple" className="w-full">
            {faqs.map((f, i) =>
            <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </section>
      </main>
    </div>);

}