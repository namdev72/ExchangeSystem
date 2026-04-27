import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import BookCard from "../components/books/BookCard";
import { Search, Sparkles } from "lucide-react";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const q = query(
          collection(db, "books"),
          where("status", "==", "available"),
          // Note: orderBy requires an index if combined with where. Assuming simple query for now.
        );
        const querySnapshot = await getDocs(q);
        const booksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort in memory to avoid index requirements for now
        booksData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBooks(booksData);
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-[#8b5cf6] rounded-3xl p-6 md:p-10 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md mb-6 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Token-powered book exchange
          </div>

          <h1 className="text-4xl md:text-5xl font-sora font-extrabold leading-tight mb-4">
            Exchange books,<br />
            <span className="text-accent">share stories.</span>
          </h1>

          <p className="text-white/80 max-w-md mb-8 text-base md:text-lg">
            Trade books with fellow readers using tokens. No money needed — just a love for reading.
          </p>

          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title or author"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-foreground pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-white/20 shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Available Books Section */}
      <div>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-sora font-bold text-foreground">Available Books</h2>
            <p className="text-muted-foreground mt-1">{filteredBooks.length} books available</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-secondary rounded-2xl aspect-[3/4] animate-pulse"></div>
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {filteredBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-secondary/50 rounded-2xl border border-border border-dashed">
            <p className="text-muted-foreground">No books found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
