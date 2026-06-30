import React, { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { 
  MessageCircle, ThumbsUp, MapPin, Share2, Eye, User, Sparkles, Send, Upload, 
  Tag, AtSign, Globe, Lock, Check, AlertCircle, Video
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SocialPost, SocialComment } from "../types";

interface SocialHubProps {
  currentUser: any;
  currentWard: string;
}

export default function SocialHub({ currentUser, currentWard }: SocialHubProps) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [image, setImage] = useState("");
  const [video, setVideo] = useState("");
  const [tagLocation, setTagLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Comment states
  const [commentText, setCommentText] = useState<{ [postId: string]: string }>({});
  const [commentAnon, setCommentAnon] = useState<{ [postId: string]: boolean }>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

  // Filter and search
  const [searchFilter, setSearchFilter] = useState("");
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Error fetching social posts:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fileData = reader.result as string;
        if (file.type.startsWith("video/")) {
          setVideo(fileData);
          setImage("");
          showToast("Video Evidence Attached! 🎥", "success", "Video loaded successfully for your discussion post.");
        } else {
          setImage(fileData);
          setVideo("");
          showToast("Image Attached! 📸", "success", "Photo loaded successfully for your discussion post.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast("Post is empty", "warning", "Please write some text to share with your community.");
      return;
    }

    setIsSubmitting(true);

    const postPayload = {
      content,
      isAnonymous,
      image: image || undefined,
      video: video || undefined,
      location: tagLocation ? {
        lat: 17.43 + (Math.random() - 0.5) * 0.03,
        lng: 78.45 + (Math.random() - 0.5) * 0.03,
        address: "Panchayat Ward Territory",
        ward: currentWard || "Ward 1 (Panchayat Center)"
      } : undefined
    };

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postPayload),
      });

      if (res.ok) {
        showToast("Discussion Published! 🌾", "success", "Your community post is live on the Panchayat Social Hub.");
        setContent("");
        setImage("");
        setVideo("");
        setIsAnonymous(false);
        setTagLocation(false);
        fetchPosts();
      } else {
        showToast("Publishing Failed", "error", "The server returned an error.");
      }
    } catch (err) {
      console.error(err);
      showToast("Network Error", "error", "Failed to connect to the forum server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: updated.likes, userLiked: updated.userLiked } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentText[postId] || "";
    if (!text.trim()) return;

    const isAnon = !!commentAnon[postId];

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, isAnonymous: isAnon }),
      });

      if (res.ok) {
        showToast("Comment Appended! 💬", "success");
        setCommentText(prev => ({ ...prev, [postId]: "" }));
        setCommentAnon(prev => ({ ...prev, [postId]: false }));
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to highlight hashtags and mentions with styles
  const formatPostText = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((word, idx) => {
      if (word.startsWith("#")) {
        const cleanTag = word.replace(/[#,.:;!?]/g, "");
        return (
          <span 
            key={idx} 
            onClick={(e) => {
              e.stopPropagation();
              setActiveHashtag(cleanTag);
              setSearchFilter("");
            }}
            className="text-indigo-600 font-bold hover:underline cursor-pointer"
          >
            {word}
          </span>
        );
      }
      if (word.startsWith("@")) {
        return (
          <span 
            key={idx} 
            className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md font-bold text-[11px] border border-indigo-100"
          >
            {word}
          </span>
        );
      }
      return word;
    });
  };

  const filteredPosts = posts.filter(post => {
    // Tag filter
    if (activeHashtag) {
      if (!post.hashtags.some(tag => tag.toLowerCase() === activeHashtag.toLowerCase())) {
        return false;
      }
    }
    // Keyword search
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      const matchContent = post.content.toLowerCase().includes(searchLower);
      const matchAuthor = post.author.name.toLowerCase().includes(searchLower);
      return matchContent || matchAuthor;
    }
    return true;
  });

  return (
    <div id="social-hub-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Informational Alerts Linkage Banner */}
      <div className="lg:col-span-12 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="bg-amber-500 text-white p-2.5 rounded-2xl shrink-0 mt-0.5">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 font-display flex items-center gap-2">
              <span>{t("Looking for Official Panchayat Announcements?")}</span>
              <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-extrabold tracking-wider animate-pulse">{t("Official Channel")}</span>
            </h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              {t("While this Social Hub is a friendly space for open community discussion among citizens, official resolutions, emergency alerts, and department announcements have a dedicated home under the Alerts section.")}
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            const btn = document.getElementById("tab-btn-notifications");
            if (btn) {
              btn.click();
            } else {
              showToast("Switching to Alerts tab...", "info");
            }
          }}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer hover:scale-[1.02] shrink-0 active:scale-95 text-center flex items-center gap-1.5 justify-center border border-amber-500/15"
        >
          {t("Check Alerts Section")}
        </button>
      </div>

      {/* Left Column: Create Post & Active Tags (4/12) */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono">
              {t("Share Gram Discussion")}
            </h3>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="space-y-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("What is happening in Nizamabad? Share announcements, alerts or opinions. Use #hashtags to tag topics, or @Sarpanch to notify officials.")}
                rows={4}
                className="w-full text-xs border border-slate-200 p-3 rounded-2xl resize-none focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 font-sans leading-relaxed text-slate-800"
              />
              <p className="text-[10px] text-slate-400">
                {t("Supports automatic hashtag recognition and staff tagging alerts.")}
              </p>
            </div>

            {/* Media Upload and Tag Location row */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-b border-slate-100 py-3">
              <div className="flex items-center gap-2">
                {/* Photo / Video selector */}
                <div className="relative cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-600 p-2.5 rounded-xl border border-slate-200 transition-colors flex items-center justify-center">
                  <Upload className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {image ? `📸 ${t("Photo evidence ready")}` : video ? `🎥 ${t("Video evidence evidence ready")}` : t("Attach Photo/Video")}
                </span>
              </div>

              {/* Tag Location button */}
              <button
                type="button"
                onClick={() => setTagLocation(!tagLocation)}
                className={`flex items-center gap-1.5 text-[11px] font-bold py-1.5 px-3 rounded-xl border transition-colors cursor-pointer ${
                  tagLocation 
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <MapPin className={`h-3.5 w-3.5 ${tagLocation ? "text-emerald-600" : "text-slate-400"}`} />
                <span>{tagLocation ? t("GPS Tagged") : t("Tag Ward Location")}</span>
              </button>
            </div>

            {/* Previews */}
            {(image || video) && (
              <div className="relative border border-slate-100 rounded-2xl overflow-hidden max-w-xs bg-slate-50 p-2 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 truncate max-w-[150px]">
                  {image ? "Evidence_Image.png" : "Evidence_Video.mp4"}
                </span>
                <button
                  type="button"
                  onClick={() => { setImage(""); setVideo(""); }}
                  className="text-[10px] bg-slate-900 text-white font-bold py-1 px-2.5 rounded-lg hover:bg-black"
                >
                  {t("Clear Attach")}
                </button>
              </div>
            )}

            {/* Anonymous Toggle Option */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 p-3 rounded-xl">
              <input
                type="checkbox"
                id="social-anon"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="social-anon" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                {t("Post anonymously (Mask identity)")}
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? t("Publishing...") : t("Publish to Social Hub")}
              <Send className="h-3 w-3" />
            </button>
          </form>
        </div>

        {/* Popular local tags block */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">
            🔥 {t("Popular Panchayat Topics")}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {["CleanVillage", "WaterSecurity", "SwachhBharat", "Streetlights", "Safety", "RoadRepair"].map((tag) => {
              const isSelected = activeHashtag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => {
                    if (isSelected) {
                      setActiveHashtag(null);
                    } else {
                      setActiveHashtag(tag);
                      setSearchFilter("");
                    }
                  }}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-indigo-600 border-indigo-600 text-white font-black" 
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
          {activeHashtag && (
            <button
              onClick={() => setActiveHashtag(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600 underline font-mono block pt-1 cursor-pointer"
            >
              Clear Topic Filter
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Search Toolbar & Posts feed (8/12) */}
      <div className="lg:col-span-8 space-y-4">
        {/* Search Toolbar */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 flex flex-wrap gap-3 items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 w-full sm:w-72 border border-slate-200 focus-within:border-indigo-500 bg-slate-50 px-3.5 py-2 rounded-xl transition-colors">
            <Globe className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations, tags or authors..."
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setActiveHashtag(null);
              }}
              className="text-xs bg-transparent border-none outline-none w-full text-slate-700"
            />
          </div>
          <span className="text-[11px] text-slate-400 font-mono font-bold">
            Showing {filteredPosts.length} discussions
          </span>
        </div>

        {/* Discussions List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-sm transition-all space-y-4"
                >
                  {/* Author Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-100 flex items-center justify-center bg-slate-50">
                        {post.author.avatar ? (
                          <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-800">
                            {post.author.name}
                          </span>
                          {post.isAnonymous && (
                            <span className="bg-slate-100 text-slate-600 text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                              Anonymous
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {post.location && (
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-mono px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-emerald-600" />
                        <span>{post.location.ward.split(" ")[0]}</span>
                      </span>
                    )}
                  </div>

                  {/* Body Text */}
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                    {formatPostText(post.content)}
                  </p>

                  {/* Media attachment if any */}
                  {post.image && (
                    <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 max-h-72 shadow-inner">
                      <img src={post.image} alt="Evidence media" className="w-full h-full object-contain max-h-72" />
                    </div>
                  )}

                  {post.video && (
                    <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 max-h-72 shadow-inner">
                      <video src={post.video} controls className="w-full h-full object-contain max-h-72" />
                    </div>
                  )}

                  {/* Footer actions row */}
                  <div className="flex items-center gap-4 border-t border-b border-slate-100 py-3 text-slate-500 text-xs">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1.5 hover:text-indigo-600 font-bold transition-colors cursor-pointer ${
                        post.userLiked ? "text-indigo-600 font-black" : ""
                      }`}
                    >
                      <ThumbsUp className={`h-4 w-4 ${post.userLiked ? "fill-indigo-500" : ""}`} />
                      <span>{post.likes} Likes</span>
                    </button>

                    <button
                      onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                      className="flex items-center gap-1.5 hover:text-slate-800 font-bold transition-colors cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments.length} Comments</span>
                    </button>
                  </div>

                  {/* Comments section */}
                  {(activeCommentPostId === post.id || post.comments.length > 0) && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                      {post.comments.length > 0 && (
                        <div className="space-y-2.5 pb-2 border-b border-slate-200/50">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="text-xs space-y-1 bg-white p-3 rounded-xl border border-slate-100">
                              <div className="flex justify-between items-center text-[10px] text-slate-400">
                                <span className="font-bold text-slate-700 flex items-center gap-1">
                                  {comment.author.name}
                                  {comment.isAnonymous && (
                                    <span className="bg-slate-100 text-[7px] px-1 py-0.5 rounded font-mono">Anon</span>
                                  )}
                                </span>
                                <span className="font-mono">{new Date(comment.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-slate-600 font-sans leading-normal">
                                {formatPostText(comment.content)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment Input */}
                      <div className="space-y-2">
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentText[post.id] || ""}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddComment(post.id);
                            }}
                            className="w-full text-xs bg-white border border-slate-200 p-2.5 rounded-xl outline-none focus:border-indigo-600"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        
                        {/* Anon Checkbox for Comment */}
                        <div className="flex items-center gap-1.5 px-1">
                          <input
                            type="checkbox"
                            id={`comment-anon-${post.id}`}
                            checked={!!commentAnon[post.id]}
                            onChange={(e) => setCommentAnon(prev => ({ ...prev, [post.id]: e.target.checked }))}
                            className="w-3 h-3 text-indigo-600 border-slate-300 rounded cursor-pointer"
                          />
                          <label htmlFor={`comment-anon-${post.id}`} className="text-[9px] font-bold text-slate-500 cursor-pointer select-none">
                            Comment anonymously
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-100 rounded-3xl min-h-[250px] text-slate-400 text-center">
                <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs">No active discussions match selected keywords.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
