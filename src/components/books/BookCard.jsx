import { Coins } from "lucide-react";
import { Link } from "react-router-dom";

export default function BookCard({ book }) {
  return (
    <Link to={`/books/${book.id}`} className="group relative block rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full">
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full bg-secondary overflow-hidden">
        {book.imageUrl ? (
          <img 
            src={book.imageUrl} 
            alt={book.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-primary/5 text-primary">
            <span className="font-sora font-semibold text-center leading-tight line-clamp-3">{book.title}</span>
          </div>
        )}
        
        {/* Token Badge overlay */}
        <div className="absolute top-3 right-3 bg-accent border border-accent-foreground/10 text-accent-foreground px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-sm">
          <Coins className="w-3 h-3" />
          {book.tokenPrice}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-sora font-semibold text-foreground line-clamp-1">{book.title}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{book.author}</p>
        
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-xs font-medium text-primary px-2 py-1 bg-primary/10 rounded-md">
            {book.condition?.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {book.category}
          </span>
        </div>
      </div>
    </Link>
  );
}
