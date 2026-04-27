import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs, doc, writeBatch, updateDoc, getDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Coins, Book, Send, Inbox, Plus, Check, X as XIcon, Loader2 } from "lucide-react";
import clsx from "clsx";
import AddBookModal from "../components/books/AddBookModal";
import BookCard from "../components/books/BookCard";

const TABS = ["My Books", "My Requests", "Incoming", "Completed"];

export default function Dashboard() {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState("My Books");
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  
  const [myBooks, setMyBooks] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch books
      const qBooks = query(collection(db, "books"), where("ownerId", "==", user.uid));
      const snapBooks = await getDocs(qBooks);
      setMyBooks(snapBooks.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch requests where I am requester
      const qMyReq = query(collection(db, "requests"), where("requesterId", "==", user.uid));
      const snapMyReq = await getDocs(qMyReq);
      
      // Fetch requests where I am owner
      const qIncReq = query(collection(db, "requests"), where("ownerId", "==", user.uid));
      const snapIncReq = await getDocs(qIncReq);
      
      const combined = [
        ...snapMyReq.docs.map(d => ({ id: d.id, ...d.data(), type: 'outgoing' })),
        ...snapIncReq.docs.map(d => ({ id: d.id, ...d.data(), type: 'incoming' }))
      ];
      
      // Remove duplicates just in case (though owner != requester)
      setAllRequests(combined);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAccept = async (req) => {
    setAcceptingId(req.id);
    try {
      const batch = writeBatch(db);
      
      // Update book status
      const bookRef = doc(db, "books", req.bookId);
      batch.update(bookRef, { status: "exchanged" });

      // Update request status
      const reqRef = doc(db, "requests", req.id);
      batch.update(reqRef, { status: "accepted" });

      // Deduct from requester
      const requesterRef = doc(db, "users", req.requesterId);
      batch.update(requesterRef, { tokenBalance: increment(-req.tokenAmount) });

      // Add to owner
      const ownerRef = doc(db, "users", req.ownerId);
      batch.update(ownerRef, { tokenBalance: increment(req.tokenAmount) });
      
      await batch.commit();

      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (req) => {
    try {
      await updateDoc(doc(db, "requests", req.id), { status: "rejected" });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const myOutgoing = allRequests.filter(r => r.type === 'outgoing');
  const myIncomingPending = allRequests.filter(r => r.type === 'incoming' && r.status === 'pending');
  const completed = allRequests.filter(r => r.status === 'accepted');

  const stats = [
    { label: "Token Balance", value: userData?.tokenBalance ?? 0, icon: Coins, color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-200" },
    { label: "Books Listed", value: myBooks.length, icon: Book, color: "text-teal-600", bg: "bg-teal-100", border: "border-teal-200" },
    { label: "My Requests", value: myOutgoing.length, icon: Send, color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200" },
    { label: "Incoming", value: myIncomingPending.length, icon: Inbox, color: "text-purple-600", bg: "bg-purple-100", border: "border-purple-200" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sora font-bold text-foreground">Welcome back, {userData?.name?.split(" ")[0] || "Reader"}</h1>
          <p className="text-muted-foreground mt-1">Manage your books and exchanges</p>
        </div>
        <button 
          onClick={() => setIsAddBookOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          List a Book
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`bg-white rounded-2xl p-5 border ${s.border} shadow-sm flex items-center justify-between`}>
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-2xl sm:text-3xl font-sora font-bold text-foreground">{s.value}</p>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
              <s.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
              activeTab === tab 
                ? "bg-white text-foreground shadow-sm border border-border" 
                : "text-muted-foreground hover:bg-secondary/80"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "My Books" && (
          loading ? (
            <div className="text-muted-foreground text-center py-10">Loading books...</div>
          ) : myBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {myBooks.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-border border-dashed">
              <Book className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-sora font-semibold text-foreground">No books listed yet</h3>
              <p className="text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">
                List books you've finished reading to earn tokens and request new ones.
              </p>
              <button 
                onClick={() => setIsAddBookOpen(true)}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
              >
                List your first book
              </button>
            </div>
          )
        )}
        
        {activeTab === "My Requests" && (
          myOutgoing.length > 0 ? (
            <div className="space-y-4">
              {myOutgoing.map(req => (
                <div key={req.id} className="bg-white p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-sora font-semibold">{req.bookTitle}</h4>
                    <p className="text-sm text-muted-foreground">Requested from {req.ownerName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={clsx("px-3 py-1 rounded-full text-xs font-bold", 
                      req.status === "accepted" ? "bg-green-100 text-green-700" : 
                      req.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {req.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                      <Coins className="w-3 h-3 text-accent" /> {req.tokenAmount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-border border-dashed">
              <Send className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">You haven't made any requests yet.</p>
            </div>
          )
        )}

        {activeTab === "Incoming" && (
          myIncomingPending.length > 0 ? (
            <div className="space-y-4">
              {myIncomingPending.map(req => (
                <div key={req.id} className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-sora font-semibold">{req.bookTitle}</h4>
                    <p className="text-sm text-muted-foreground">From: {req.requesterName}</p>
                    <span className="text-sm font-semibold flex items-center gap-1 mt-1 text-accent">
                      <Coins className="w-4 h-4" /> {req.tokenAmount} tokens
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleReject(req)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors"
                    >
                      <XIcon className="w-4 h-4"/> Reject
                    </button>
                    <button 
                      onClick={() => handleAccept(req)}
                      disabled={acceptingId === req.id}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors"
                    >
                      {acceptingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4"/> Accept</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-border border-dashed">
              <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No incoming requests right now.</p>
            </div>
          )
        )}

        {activeTab === "Completed" && (
          completed.length > 0 ? (
            <div className="space-y-4">
              {completed.map(req => (
                <div key={req.id} className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-sora font-semibold">{req.bookTitle}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold", req.type === 'incoming' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700")}>
                        {req.type === 'incoming' ? 'Sent' : 'Received'}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {req.type === 'incoming' ? `To: ${req.requesterName}` : `From: ${req.ownerName}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => alert("Chat feature coming soon!")}
                      className="border border-teal-600 text-teal-600 hover:bg-teal-50 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-border border-dashed">
              <p className="text-muted-foreground">No completed exchanges yet.</p>
            </div>
          )
        )}
      </div>

      <AddBookModal 
        isOpen={isAddBookOpen} 
        onClose={() => setIsAddBookOpen(false)} 
        onSuccess={fetchData}
      />
    </div>
  );
}
