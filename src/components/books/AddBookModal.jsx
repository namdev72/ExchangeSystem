import { useState } from "react";
import { X, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function AddBookModal({ isOpen, onClose, onSuccess }) {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    condition: "good",
    tokenPrice: 10,
    category: "generic",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "reactbook");

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dhzepe4jk"}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        return data.secure_url;
      }
      throw new Error(data.error?.message || "Failed to upload image");
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        toast.loading("Uploading image...", { id: "upload" });
        imageUrl = await uploadToCloudinary(imageFile);
        toast.dismiss("upload");
      }

      const bookData = {
        ...formData,
        imageUrl,
        tokenPrice: Number(formData.tokenPrice),
        status: "available",
        ownerId: user.uid,
        ownerName: userData?.name || "Anonymous",
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "books"), bookData);
      toast.success("Book listed successfully!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.dismiss("upload");
      toast.error("Error listing book. Did you configure the Cloudinary upload preset?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <h2 className="text-xl font-sora font-bold">List a Book</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 md:p-6">
          <form id="add-book-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Book Cover</label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:bg-secondary/50 transition-colors relative">
                {imagePreview ? (
                  <div className="relative w-32 h-48 mx-auto">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md shadow-sm" />
                    <button 
                      type="button" 
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer py-6">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-primary">Click to upload cover</span>
                    <span className="text-xs text-muted-foreground mt-1">JPEG, PNG, JPG</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary/50 outline-none" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">Author</label>
                <input required type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary/50 outline-none" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea rows="3" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary/50 outline-none resize-none" placeholder="Write a brief description of the book..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Condition</label>
                <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary/50 outline-none bg-white">
                  <option value="like_new">Like New</option>
                  <option value="very_good">Very Good</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Token Price</label>
                <input required type="number" min="1" value={formData.tokenPrice} onChange={e => setFormData({...formData, tokenPrice: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary/50 outline-none" />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 md:p-6 border-t border-border bg-secondary/30 mt-auto">
          <button 
            type="submit" 
            form="add-book-form"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "List Book"}
          </button>
        </div>
      </div>
    </div>
  );
}
