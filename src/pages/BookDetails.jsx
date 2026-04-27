import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Coins, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [alreadyRequested, setAlreadyRequested] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const docRef = doc(db, "books", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBook({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Book not found");
          navigate("/");
        }

        if (user) {
          const reqQ = query(
            collection(db, "requests"),
            where("bookId", "==", id),
            where("requesterId", "==", user.uid),
            where("status", "==", "pending")
          );
          const reqSnap = await getDocs(reqQ);
          if (!reqSnap.empty) {
            setAlreadyRequested(true);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id, user, navigate]);

  const handleRequest = async () => {
    if (!user) return navigate("/login");
    
    if (userData?.tokenBalance < book.tokenPrice) {
      toast.error(`You need ${book.tokenPrice} tokens to request this book.`);
      return;
    }

    setRequesting(true);
    try {
      await addDoc(collection(db, "requests"), {
        bookId: book.id,
        bookTitle: book.title,
        tokenAmount: book.tokenPrice,
        requesterId: user.uid,
        requesterName: userData.name,
        ownerId: book.ownerId,
        ownerName: book.ownerName,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      setAlreadyRequested(true);
      toast.success("Request sent successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send request");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!book) return null;

  const isOwner = user?.uid === book.ownerId;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-border flex flex-col md:flex-row gap-8">
        
        {/* Left: Image */}
        <div className="w-full md:w-1/3 shrink-0">
          <div className="aspect-[3/4] w-full rounded-2xl bg-secondary overflow-hidden border border-border shadow-md">
            {book.imageUrl ? (
              <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary p-4">
                <span className="font-sora font-semibold text-center">{book.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex-1 flex flex-col">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-sora font-bold text-foreground leading-tight">{book.title}</h1>
              <p className="text-lg text-muted-foreground mt-1">by {book.author}</p>
            </div>
            
            <div className="bg-accent/10 border border-accent/20 text-accent-foreground px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm">
              <Coins className="w-5 h-5 text-accent" />
              {book.tokenPrice} Tokens
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-primary/10 text-primary font-semibold text-sm rounded-lg capitalize">
              Condition: {book.condition?.replace('_', ' ')}
            </span>
            <span className="px-3 py-1 bg-secondary text-secondary-foreground font-semibold text-sm rounded-lg capitalize">
              {book.category}
            </span>
            <span className="px-3 py-1 bg-teal-50 text-teal-700 font-semibold text-sm rounded-lg flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Verified User
            </span>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold text-foreground mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {book.description || "No description provided."}
            </p>
          </div>

          <div className="mt-auto pt-6 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Listed by</p>
              <p className="font-semibold text-foreground">{book.ownerName}</p>
            </div>

            {isOwner ? (
              <button disabled className="bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-semibold opacity-70 cursor-not-allowed">
                Your Book
              </button>
            ) : alreadyRequested ? (
              <button disabled className="bg-green-100 text-green-700 border border-green-200 px-6 py-3 rounded-xl font-semibold opacity-90 cursor-not-allowed">
                Request Sent
              </button>
            ) : book.status !== "available" ? (
              <button disabled className="bg-secondary text-secondary-foreground px-6 py-3 rounded-xl font-semibold opacity-70 cursor-not-allowed">
                Not Available
              </button>
            ) : (
              <button 
                onClick={handleRequest}
                disabled={requesting}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-semibold shadow-md transition-all flex items-center gap-2"
              >
                {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Request Exchange"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
