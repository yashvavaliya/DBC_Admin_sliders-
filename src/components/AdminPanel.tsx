import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Globe,
  Camera,
  Palette,
  Layout,
  Eye,
  Save,
  LogOut,
  Plus,
  X,
  ExternalLink,
  Settings,
  BarChart3,
  Share2,
  Download,
  Copy,
  Check,
  Star,
  Image as ImageIcon,
  MessageCircle,
  MapPin,
  ArrowBigRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import { ImageUpload } from "./ImageUpload";
import { CardPreview } from "./CardPreview";
import { MediaUpload } from "./MediaUpload";
import { ReviewsManager } from "./ReviewsManager";
import {
  generateSocialLink,
  extractUsernameFromUrl,
  isPlatformAutoSyncable,
  generateAutoSyncedLinks,
  SOCIAL_PLATFORMS,
} from "../utils/socialUtils";
import type { Database } from "../lib/supabase";
import { getSocialIcon, SOCIAL_PLATFORM_COLORS } from "../utils/socialUtils";

type BusinessCard = Database["public"]["Tables"]["business_cards"]["Row"];
type SocialLink = Database["public"]["Tables"]["social_links"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface MediaItem {
  id: string;
  type: "image" | "video" | "document";
  url: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  review_url: string;
  title: string;
}

interface FormData {
  // Basic Information
  title: string;
  username: string;
  globalUsername: string;
  company: string;
  tagline: string;
  profession: string;
  avatar_url: string;

  // Contact Information
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  map_link: string;

  // Theme and Layout
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    name: string;
  };
  shape: string;
  layout: {
    style: string;
    alignment: string;
    font: string;
  };
  is_published: boolean;
}

const THEMES = [
  {
    name: "Ocean Blue",
    primary: "#3B82F6",
    secondary: "#1E40AF",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Forest Green",
    primary: "#10B981",
    secondary: "#047857",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Sunset Orange",
    primary: "#F59E0B",
    secondary: "#D97706",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Royal Purple",
    primary: "#8B5CF6",
    secondary: "#7C3AED",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Rose Pink",
    primary: "#EC4899",
    secondary: "#DB2777",
    background: "#FFFFFF",
    text: "#1F2937",
  },
  {
    name: "Dark Mode",
    primary: "#60A5FA",
    secondary: "#3B82F6",
    background: "#1F2937",
    text: "#F9FAFB",
  },
];

export const AdminPanel: React.FC = () => {
  // Confetti celebration state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

  // Confetti animation (simple canvas-based)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showConfetti) {
      timeout = setTimeout(() => {
        setShowConfetti(false);
        setShowCongrats(false);
      }, 7000); // Increased duration to 7 seconds
    }
    return () => clearTimeout(timeout);
  }, [showConfetti]);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businessCard, setBusinessCard] = useState<BusinessCard | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    username: "",
    globalUsername: "",
    company: "",
    tagline: "",
    profession: "",
    avatar_url: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    address: "",
    map_link: "",
    theme: THEMES[0],
    shape: "rectangle",
    layout: {
      style: "modern",
      alignment: "center",
      font: "Inter",
    },
    is_published: false,
  });

  const [newSocialLink, setNewSocialLink] = useState({
    platform: "",
    username: "",
  });

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*, global_username")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Profile error:", profileError);
      } else if (profileData) {
        setProfile(profileData);
      }

      // Load business card
      const { data: cardData, error: cardError } = await supabase
        .from("business_cards")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (cardError && cardError.code !== "PGRST116") {
        console.error("Card error:", cardError);
      } else if (cardData) {
        setBusinessCard(cardData);

        // Update form data with card data
        const theme = (cardData.theme as any) || THEMES[0];
        const layout = (cardData.layout as any) || {
          style: "modern",
          alignment: "center",
          font: "Inter",
        };

        setFormData({
          title: cardData.title || "",
          username: cardData.slug || "",
          globalUsername: profileData?.global_username || "",
          company: cardData.company || "",
          tagline: cardData.bio || "",
          profession: cardData.position || "",
          avatar_url: cardData.avatar_url || "",
          phone: cardData.phone || "",
          whatsapp: (cardData as any).whatsapp || "",
          email: cardData.email || "",
          website: cardData.website || "",
          address: (cardData as any).address || "",
          map_link: (cardData as any).map_link || "",
          theme,
          shape: cardData.shape || "rectangle",
          layout,
          is_published: cardData.is_published || false,
        });

        // Load social links
        const { data: socialData, error: socialError } = await supabase
          .from("social_links")
          .select("*, is_auto_synced")
          .eq("card_id", cardData.id)
          .order("display_order");

        if (socialError) {
          console.error("Social links error:", socialError);
        } else {
          setSocialLinks(socialData || []);
        }
      } else {
        // Set default form data with user email
        setFormData((prev) => ({
          ...prev,
          globalUsername: profileData?.global_username || "",
          email: user.email || "",
          title: profileData?.name || user.email?.split("@")[0] || "",
        }));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update profile with global username
      if (profile) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            name: formData.title,
            global_username: formData.globalUsername || null,
          })
          .eq("id", user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }
      }

      let cardId = businessCard?.id;

      if (!businessCard) {
        // Create new business card
        const { data: newCard, error: createError } = await supabase
          .from("business_cards")
          .insert({
            user_id: user.id,
            title: formData.title,
            company: formData.company,
            position: formData.profession,
            phone: formData.phone,
            email: formData.email,
            website: formData.website,
            avatar_url: formData.avatar_url,
            bio: formData.tagline,
            theme: formData.theme,
            shape: formData.shape,
            layout: formData.layout,
            is_published: formData.is_published,
            slug: formData.username || null,
            whatsapp: formData.whatsapp,
            address: formData.address,
            map_link: formData.map_link,
          })
          .select()
          .single();

        if (createError) throw createError;
        setBusinessCard(newCard);
        cardId = newCard.id;
      } else {
        // Update existing business card
        const { error: updateError } = await supabase
          .from("business_cards")
          .update({
            title: formData.title,
            company: formData.company,
            position: formData.profession,
            phone: formData.phone,
            email: formData.email,
            website: formData.website,
            avatar_url: formData.avatar_url,
            bio: formData.tagline,
            theme: formData.theme,
            shape: formData.shape,
            layout: formData.layout,
            is_published: formData.is_published,
            slug: formData.username || null,
            whatsapp: formData.whatsapp,
            address: formData.address,
            map_link: formData.map_link,
          })
          .eq("id", businessCard.id);

        if (updateError) throw updateError;
      }

      // Profile update moved above

      // Optionally, show a non-intrusive toast or silent feedback here
      await loadUserData(); // Reload data
    } catch (error) {
      console.error("Save error:", error);
      // Optionally, show a non-intrusive error message here
    } finally {
      setSaving(false);
    }
  };

  const handleAddSocialLink = async () => {
    if (!businessCard || !newSocialLink.platform || !newSocialLink.username) {
      alert("Please fill in platform and username");
      return;
    }

    try {
      const url = generateSocialLink(
        newSocialLink.platform,
        newSocialLink.username
      );
      const isAutoSyncable = isPlatformAutoSyncable(newSocialLink.platform);

      const { data, error } = await supabase
        .from("social_links")
        .insert({
          card_id: businessCard.id,
          platform: newSocialLink.platform,
          username: newSocialLink.username,
          url: url,
          display_order: socialLinks.length,
          is_auto_synced:
            isAutoSyncable &&
            newSocialLink.username === formData.globalUsername,
        })
        .select()
        .single();

      if (error) throw error;

      setSocialLinks([...socialLinks, data]);
      setNewSocialLink({ platform: "", username: "" });
    } catch (error) {
      console.error("Error adding social link:", error);
      alert("Failed to add social link. Please try again.");
    }
  };

  const handleGlobalUsernameChange = async (newGlobalUsername: string) => {
    const oldGlobalUsername = formData.globalUsername;
    setFormData({ ...formData, globalUsername: newGlobalUsername });

    // If we have a business card and the global username changed
    if (
      businessCard &&
      oldGlobalUsername !== newGlobalUsername &&
      newGlobalUsername
    ) {
      try {
        // Update auto-synced social links
        const autoSyncedLinks = socialLinks.filter(
          (link) => link.is_auto_synced
        );

        for (const link of autoSyncedLinks) {
          if (isPlatformAutoSyncable(link.platform)) {
            const newUrl = generateSocialLink(link.platform, newGlobalUsername);

            await supabase
              .from("social_links")
              .update({
                username: newGlobalUsername,
                url: newUrl,
              })
              .eq("id", link.id);
          }
        }

        // Reload social links to reflect changes
        const { data: updatedSocialData } = await supabase
          .from("social_links")
          .select("*, is_auto_synced")
          .eq("card_id", businessCard.id)
          .order("display_order");

        if (updatedSocialData) {
          setSocialLinks(updatedSocialData);
        }
      } catch (error) {
        console.error("Error updating auto-synced links:", error);
      }
    }
  };

  const handleAutoSyncSocialLinks = async () => {
    if (!businessCard || !formData.globalUsername) {
      alert("Please set a global username first");
      return;
    }

    try {
      const autoSyncedLinks = generateAutoSyncedLinks(formData.globalUsername);
      const existingPlatforms = socialLinks.map((link) => link.platform);

      // Only add platforms that don't already exist
      const newLinks = autoSyncedLinks.filter(
        (link) => !existingPlatforms.includes(link.platform)
      );

      if (newLinks.length === 0) {
        alert("All auto-syncable platforms are already added");
        return;
      }

      const insertData = newLinks.map((link, index) => ({
        card_id: businessCard.id,
        platform: link.platform,
        username: link.username,
        url: link.url,
        display_order: socialLinks.length + index,
        is_auto_synced: true,
      }));

      const { data, error } = await supabase
        .from("social_links")
        .insert(insertData)
        .select();

      if (error) throw error;

      setSocialLinks([...socialLinks, ...data]);
      alert(`Added ${newLinks.length} auto-synced social links`);
    } catch (error) {
      console.error("Error auto-syncing social links:", error);
      alert("Failed to auto-sync social links. Please try again.");
    }
  };

  const handleSocialLinkEdit = async (linkId: string, newUsername: string) => {
    try {
      const link = socialLinks.find((l) => l.id === linkId);
      if (!link) return;

      const newUrl = generateSocialLink(link.platform, newUsername);
      const wasAutoSynced = link.is_auto_synced;

      // If user manually edits, it's no longer auto-synced
      const isStillAutoSynced =
        wasAutoSynced && newUsername === formData.globalUsername;

      const { error } = await supabase
        .from("social_links")
        .update({
          username: newUsername,
          url: newUrl,
          is_auto_synced: isStillAutoSynced,
        })
        .eq("id", linkId);

      if (error) throw error;

      // Update local state
      setSocialLinks(
        socialLinks.map((l) =>
          l.id === linkId
            ? {
                ...l,
                username: newUsername,
                url: newUrl,
                is_auto_synced: isStillAutoSynced,
              }
            : l
        )
      );
    } catch (error) {
      console.error("Error updating social link:", error);
    }
  };

  const handleRemoveSocialLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from("social_links")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSocialLinks(socialLinks.filter((link) => link.id !== id));
    } catch (error) {
      console.error("Error removing social link:", error);
      alert("Failed to remove social link. Please try again.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const copyCardUrl = () => {
    const url = `${window.location.origin}/c/${
      formData.username || businessCard?.slug || businessCard?.id
    }`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "basic", label: "Basic Info", icon: User },
    { id: "contact", label: "Contact", icon: Mail },
    { id: "social", label: "Social Links", icon: Share2 },
    { id: "media", label: "Media", icon: ImageIcon },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "design", label: "Design", icon: Palette },
  ];

  // ConfettiAnimation component
  function ConfettiAnimation() {
    const confettiColors = [
      "#F59E0B", // Amber
      "#3B82F6", // Blue
      "#10B981", // Emerald
      "#EC4899", // Pink
      "#8B5CF6", // Violet
      "#60A5FA", // Light Blue
      "#DB2777", // Fuchsia
      "#D97706", // Orange
      "#7C3AED", // Purple
      "#1E40AF", // Navy
      "#F87171", // Red
      "#34D399", // Green
      "#FBBF24", // Yellow
      "#A3E635", // Lime
      "#F472B6", // Rose
      "#38BDF8", // Sky
      "#FDE68A", // Light Yellow
      "#C026D3", // Deep Purple
      "#F43F5E", // Deep Pink
      "#22D3EE", // Cyan
      "#EAB308", // Gold
      "#BE185D", // Magenta
      "#059669", // Teal
      "#FACC15", // Sun
    ];
    // Show more pieces, smaller size
    const confettiPieces = Array.from({ length: 600 }, (_, i) => i);
    return (
      <div className="fixed inset-0 z-50 pointer-events-none">
        {confettiPieces.map((i: number) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 1.5;
          const duration = 2.5 + Math.random() * 1.5;
          const size = 6 + Math.random() * 6; // 6–12px
          const color =
            confettiColors[Math.floor(Math.random() * confettiColors.length)];
          const rotate = Math.random() * 360;
          return (
            <div
              key={i}
              style={{
                left: `${left}%`,
                width: size,
                height: size,
                backgroundColor: color,
                top: 0,
                borderRadius: 3,
                position: "absolute",
                animation: `confetti-fall ${duration}s ${delay}s linear forwards`,
                transform: `rotate(${rotate}deg)`,
              }}
              className="confetti-piece"
            ></div>
          );
        })}
        <style>{`
        @keyframes confetti-fall {
          0% { opacity: 1; top: 0; }
          80% { opacity: 1; }
          100% { opacity: 0; top: 90vh; }
        }
        .confetti-piece {
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .animate-fade-in {
          animation: fadeIn 0.5s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 transition-transform duration-300 translate-y-0">
        <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <img
                src="https://github.com/yash131120/DBC_____logo/blob/main/dbclogo.png?raw=true"
                alt="Digital Business Card Logo"
                className="h-24 w-auto"
              />
            </div>
            {/* Desktop Nav */}
            <div className="hidden sm:flex items-center gap-4">
              <button
                onClick={copyCardUrl}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 text-purple-500 rounded-lg hover:bg-purple-500 hover:text-white transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy URL"}
              </button>
              <button
                onClick={async () => {
                  await handleSave();
                  setShowConfetti(true);
                  setShowCongrats(true);
                }}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed bg-yellow-50 text-yellow-500 rounded-lg font-medium hover:bg-yellow-500 hover:text-white transition-colors text-sm border-2 border-yellow-500"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors border-2 border-gray-300 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
            {/* Mobile Nav Toggle */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 focus:outline-none"
                aria-label="Open menu"
              >
                {/* Hamburger Icon */}
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="2" rx="1" fill="currentColor"/><rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor"/><rect x="4" y="16" width="16" height="2" rx="1" fill="currentColor"/></svg>
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Nav Drawer/Modal */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 flex justify-center items-start">
            <div className="bg-white rounded-2xl shadow-2xl w-80 mt-10 p-10 relative flex flex-col items-center" style={{boxShadow: '0 8px 32px rgba(0,0,0,0.18)'}}>
              {/* <button
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close"
              >
                &times;
              </button> */}
              <button
                onClick={() => setMobileNavOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 bg-white rounded-lg p-2 border border-gray-300"
                aria-label="Close menu"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <div className="flex flex-col gap-4 ">
                {formData.username && (
                         <a
                           href={`/c/${formData.username}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="inline-flex items-center gap-2 px-5 py-4 text-base bg-green-50 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-colors font-semibold border-2 border-green-500 shadow"
                         >
                           <Eye className="w-5 h-5" />
                           View Live Card
                         </a>
                       )}
                <button
                  onClick={() => { copyCardUrl(); setMobileNavOpen(false); }}
                  className="inline-flex items-center gap-2 px-5 py-4 text-base bg-purple-50 text-purple-500 rounded-xl hover:bg-purple-500 hover:text-white transition-colors font-semibold border-2 border-purple-500 shadow"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  {copied ? "Copied!" : "Copy URL"}
                </button>
                <button
                  onClick={async () => {
                    await handleSave();
                    setShowConfetti(true);
                    setShowCongrats(true);
                    setMobileNavOpen(false);
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed bg-yellow-50 text-yellow-500 rounded-xl font-semibold hover:bg-yellow-500 hover:text-white transition-colors border-2 border-yellow-500 shadow"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={async () => { await handleSignOut(); setMobileNavOpen(false); }}
                  className="inline-flex items-center gap-2 px-5 py-4 text-base text-gray-600 hover:text-gray-900 transition-colors border-2 border-gray-300 rounded-xl font-semibold shadow"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
            <style>{`
              .animate-fade-in {
                animation: fadeInModal 0.25s cubic-bezier(.23,1.02,.53,.97);
              }
              @keyframes fadeInModal {
                0% { opacity: 0; transform: scale(0.95); }
                100% { opacity: 1; transform: scale(1); }
              }
            `}</style>
            </div>
         
        )}
        {/* {mobileNavOpen && (
          <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center">
            <div className="relative w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl px-6 py-8 flex flex-col gap-6 animate-fade-in" style={{margin: '0 16px'}}>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
                aria-label="Close menu"
              >
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <div className="flex flex-col gap-4 mt-[100%]">
                <button
                  onClick={() => { copyCardUrl(); setMobileNavOpen(false); }}
                  className="inline-flex items-center gap-2 px-5 py-4 text-base bg-purple-50 text-purple-500 rounded-xl hover:bg-purple-500 hover:text-white transition-colors font-semibold shadow"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  {copied ? "Copied!" : "Copy URL"}
                </button>
                <button
                  onClick={async () => {
                    await handleSave();
                    setShowConfetti(true);
                    setShowCongrats(true);
                    setMobileNavOpen(false);
                  }}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed bg-yellow-50 text-yellow-500 rounded-xl font-semibold hover:bg-yellow-500 hover:text-white transition-colors border-2 border-yellow-500 shadow"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={async () => { await handleSignOut(); setMobileNavOpen(false); }}
                  className="inline-flex items-center gap-2 px-5 py-4 text-base text-gray-600 hover:text-gray-900 transition-colors border-2 border-gray-300 rounded-xl font-semibold shadow"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
            <style>{`
              .animate-fade-in {
                animation: fadeInModal 0.25s cubic-bezier(.23,1.02,.53,.97);
              }
              @keyframes fadeInModal {
                0% { opacity: 0; transform: scale(0.95); }
                100% { opacity: 1; transform: scale(1); }
              }
            `}</style>
          </div>
        )} */}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                          activeTab === tab.id
                            ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Basic Info Tab */}
                {activeTab === "basic" && (
                  <div className="space-y-6 relative">
                    <div className="flex flex-col sm:flex-row items-center gap-1">
                      <div className="flex-shrink-0 flex justify-center items-center w-full sm:w-auto mb-4 sm:mb-0">
                        <ImageUpload
                          currentImageUrl={formData.avatar_url}
                          onImageChange={(url) =>
                            setFormData({ ...formData, avatar_url: url || "" })
                          }
                          userId={user?.id || ""}
                          className="mx-auto"
                        />
                      </div>
                      <div className="flex-1 w-full sm:w-auto space-y-4">
                        <div className="w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                title: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Your full name"
                          />
                        </div>
                        <div className="w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Card URL Username *
                          </label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              /c/
                            </span>
                            <input
                              type="text"
                              value={formData.username}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  username: e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]/g, ""),
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="yourname"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            This will be your card's URL: /c/
                            {formData.username || "yourname"}
                          </p>
                        </div>
                        <div className="w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Global Username (for social links)
                          </label>
                          <input
                            type="text"
                            value={formData.globalUsername}
                            onChange={(e) =>
                              handleGlobalUsernameChange(
                                e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9_]/g, "")
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Add common username"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This username will auto-sync across all your social
                            media platforms
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company/Organization
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              company: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your company name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job Title/Profession
                        </label>
                        <input
                          type="text"
                          value={formData.profession}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              profession: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Your job title"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tagline/Bio
                      </label>
                      <textarea
                        value={formData.tagline}
                        onChange={(e) =>
                          setFormData({ ...formData, tagline: e.target.value })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="A brief description about yourself or your business"
                      />
                    </div>

                    <div className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="is_published"
                          checked={formData.is_published}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_published: e.target.checked,
                            })
                          }
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span
                          className={`inline-block w-3 h-3 rounded-full ${
                            formData.is_published
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                        <label
                          htmlFor="is_published"
                          className="text-sm font-medium text-gray-700"
                        >
                          Publish card (make it publicly accessible)
                        </label>
                      </div>
                    </div>
                    {/* Next button moved to bottom right */}
                    <div className="flex justify-end mt-10">
                      <button
                        type="button"
                        className="px-10 py-2 flex items-center gap-2 bg-yellow-50 text-yellow-500 rounded-lg font-medium hover:bg-yellow-500 hover:text-white transition-colors text-sm border-2 border-yellow-500"
                        onClick={async () => {
                          await handleSave();
                          setActiveTab("contact");
                        }}
                      >
                        Next
                        <ArrowBigRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Contact Tab */}
                {activeTab === "contact" && (
                  <div className="space-y-4 relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Mail className="w-4 h-4 inline mr-1" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Phone className="w-4 h-4 inline mr-1" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Globe className="w-4 h-4 inline mr-1" />
                          Website
                        </label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              website: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Address
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your business address"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Google Maps Link
                        </label>
                        <input
                          type="url"
                          value={formData.map_link}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              map_link: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://maps.google.com/..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end mt-10">
                      <button
                        type="button"
                        className="px-10 py-2 flex items-center gap-2 bg-yellow-50 text-yellow-500 rounded-lg font-medium hover:bg-yellow-500 hover:text-white transition-colors text-sm border-2 border-yellow-500"
                        onClick={async () => {
                          await handleSave();
                          setActiveTab("social");
                        }}
                      >
                        Next
                        <ArrowBigRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Social Links Tab */}
                {activeTab === "social" && (
                  <div className="space-y-6 relative">
                    {/* Global Username Info */}
                    {formData.globalUsername && (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-blue-900">
                              Global Username: @{formData.globalUsername}
                            </h4>
                            <p className="text-sm text-blue-700">
                              Auto-synced links will use this username
                            </p>
                          </div>
                          <button
                            onClick={handleAutoSyncSocialLinks}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Auto-Sync All Platforms
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Add New Social Link */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-4">
                        Add Social Link
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Platform
                          </label>
                          <select
                            value={newSocialLink.platform}
                            onChange={(e) =>
                              setNewSocialLink({
                                ...newSocialLink,
                                platform: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select platform</option>
                            {Object.keys(SOCIAL_PLATFORMS).map((platform) => (
                              <option key={platform} value={platform}>
                                {platform}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username/Handle
                          </label>
                          <div className="flex">
                            <input
                              type="text"
                              value={newSocialLink.username}
                              onChange={(e) =>
                                setNewSocialLink({
                                  ...newSocialLink,
                                  username: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={
                                newSocialLink.platform &&
                                SOCIAL_PLATFORMS[newSocialLink.platform]
                                  ? SOCIAL_PLATFORMS[newSocialLink.platform]
                                      .placeholder
                                  : "username"
                              }
                            />
                            <button
                              onClick={handleAddSocialLink}
                              className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Existing Social Links */}
                    <div className="space-y-3">
                      {socialLinks.map((link) => (
                        <div
                          key={link.id}
                          className={`flex items-center justify-between p-4 bg-white border rounded-lg ${
                            link.is_auto_synced
                              ? "border-blue-200 bg-blue-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex items-center justify-center rounded-lg border-2 ${link.platform === "GitHub" ? "bg-gray-200" : ""}`} style={{ background: SOCIAL_PLATFORM_COLORS[link.platform] + '22', borderColor: SOCIAL_PLATFORM_COLORS[link.platform] + '55' }}>
                              {(() => {
                                const Icon = getSocialIcon(link.platform);
                                const color = SOCIAL_PLATFORM_COLORS[link.platform] || '#333';
                                return <Icon className="w-5 h-5" color={color} />;
                              })()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {link.platform}
                                </span>
                                {link.is_auto_synced && (
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    Auto-synced
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  value={link.username || ""}
                                  onChange={(e) =>
                                    handleSocialLinkEdit(
                                      link.id,
                                      e.target.value
                                    )
                                  }
                                  className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="username"
                                />
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSocialLink(link.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {socialLinks.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p>No social links added yet.</p>
                        <p className="text-sm mb-4">
                          Add your social media profiles to connect with
                          visitors.
                        </p>
                        {formData.globalUsername && (
                          <button
                            onClick={handleAutoSyncSocialLinks}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Auto-Sync with @{formData.globalUsername}
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex justify-end mt-10">
                      <button
                        type="button"
                        className="px-10 py-2 flex items-center gap-2 bg-yellow-50 text-yellow-500 rounded-lg font-medium hover:bg-yellow-500 hover:text-white transition-colors text-sm border-2 border-yellow-500"
                        onClick={async () => {
                          await handleSave();
                          setActiveTab("media");
                        }}
                      >
                        Next
                        <ArrowBigRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Media Tab */}
                {activeTab === "media" && businessCard && (
                  <div className="relative">
                    <MediaUpload
                      cardId={businessCard.id}
                      mediaItems={mediaItems}
                      onMediaChange={setMediaItems}
                      userId={user?.id || ""}
                    />
                    <div className="flex justify-end mt-10">
                      <button
                        type="button"
                        className="px-10 py-2 flex items-center gap-2 bg-yellow-50 text-yellow-500 rounded-lg font-medium hover:bg-yellow-500 hover:text-white transition-colors text-sm border-2 border-yellow-500"
                        onClick={async () => {
                          await handleSave();
                          setActiveTab("reviews");
                        }}
                      >
                        Next
                        <ArrowBigRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === "reviews" && businessCard && (
                  <div className="relative">
                    <ReviewsManager
                      cardId={businessCard.id}
                      reviews={reviews}
                      onReviewsChange={setReviews}
                    />
                    <div className="flex justify-end mt-10">
                      <button
                        type="button"
                        className="px-10 py-2 flex items-center gap-2 bg-yellow-50 text-yellow-500 rounded-lg font-medium hover:bg-yellow-500 hover:text-white transition-colors text-sm border-2 border-yellow-500"
                        onClick={async () => {
                          await handleSave();
                          setActiveTab("design");
                        }}
                      >
                        Next
                        <ArrowBigRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Design Tab */}
                {activeTab === "design" && (
                  <div className="space-y-6 flex flex-col relative min-h-[60vh]">
                    {/* Confetti Canvas */}
                    {/* Confetti Canvas - overlay, does not affect layout */}
                    {showConfetti && (
                      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
                        <ConfettiAnimation />
                      </div>
                    )}
                    {/* Congratulatory Message */}
                    {showCongrats && (
                      <div 
                        className="fixed top-1/2 left-1/2 z-50 bg-white bg-opacity-95 rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center justify-center animate-congrats-fade-in"
                        style={{ transform: 'translate(-50%, -50%)', minWidth: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
                      >
                        <span className="text-6xl mb-3 animate-bounce-emoji" style={{ display: 'inline-block' }}>🎉</span>
                        <span className="text-2xl font-extrabold text-gradient bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 bg-clip-text text-transparent mb-2 animate-congrats-scale">Congratulations!</span>
                        <span className="text-lg text-gray-700 font-medium animate-congrats-fade">You successfully built your card.</span>
                        <style>{`
                          @keyframes congrats-fade-in {
                            0% { opacity: 0; transform: scale(0.8) translate(-50%, -50%); }
                            60% { opacity: 1; transform: scale(1.05) translate(-50%, -50%); }
                            100% { opacity: 1; transform: scale(1) translate(-50%, -50%); }
                          }
                          .animate-congrats-fade-in {
                            animation: congrats-fade-in 0.8s cubic-bezier(.23,1.02,.53,.97);
                          }
                          @keyframes bounce-emoji {
                            0%, 100% { transform: translateY(0); }
                            20% { transform: translateY(-18px); }
                            40% { transform: translateY(0); }
                            60% { transform: translateY(-10px); }
                            80% { transform: translateY(0); }
                          }
                          .animate-bounce-emoji {
                            animation: bounce-emoji 1.2s;
                          }
                          @keyframes congrats-scale {
                            0% { opacity: 0; transform: scale(0.7); }
                            60% { opacity: 1; transform: scale(1.1); }
                            100% { opacity: 1; transform: scale(1); }
                          }
                          .animate-congrats-scale {
                            animation: congrats-scale 0.7s cubic-bezier(.23,1.02,.53,.97);
                          }
                          @keyframes congrats-fade {
                            0% { opacity: 0; }
                            100% { opacity: 1; }
                          }
                          .animate-congrats-fade {
                            animation: congrats-fade 1.2s;
                          }
                        `}</style>
                      </div>
                    )}
                    {/* Theme Selection */}
                    <div className="w-full max-w-2xl mx-auto">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Choose Theme
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {THEMES.map((theme) => (
                          <button
                            key={theme.name}
                            onClick={() => setFormData({ ...formData, theme })}
                            className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between w-full ${
                              formData.theme.name === theme.name
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-7 h-6 rounded-full"
                                style={{ backgroundColor: theme.primary }}
                              />
                              <div
                                className="w-7 h-6 rounded-full"
                                style={{ backgroundColor: theme.secondary }}
                              />
                            </div>
                            <div className="text-sm font-medium text-gray-900 ml-4 text-right">
                              {theme.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Card Shape */}
                    <div className="w-full max-w-2xl mx-auto">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Card Shape
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: "rectangle", label: "Rectangle" },
                          { value: "rounded", label: "Rounded" },
                          { value: "circle", label: "Circle" },
                        ].map((shape) => (
                          <button
                            key={shape.value}
                            onClick={() =>
                              setFormData({ ...formData, shape: shape.value })
                            }
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.shape === shape.value
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {shape.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Layout Options */}
                    <div className="w-full max-w-2xl mx-auto">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Layout Style
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { value: "modern", label: "Modern" },
                          { value: "classic", label: "Classic" },
                          { value: "minimal", label: "Minimal" },
                          { value: "creative", label: "Creative" },
                        ].map((style) => (
                          <button
                            key={style.value}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                layout: {
                                  ...formData.layout,
                                  style: style.value,
                                },
                              })
                            }
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.layout.style === style.value
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {style.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Text Alignment */}
                    <div className="w-full max-w-2xl mx-auto">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Text Alignment
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { value: "left", label: "Left" },
                          { value: "center", label: "Center" },
                          { value: "right", label: "Right" },
                        ].map((alignment) => (
                          <button
                            key={alignment.value}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                layout: {
                                  ...formData.layout,
                                  alignment: alignment.value,
                                },
                              })
                            }
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.layout.alignment === alignment.value
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {alignment.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Font Selection */}
                    <div className="w-full max-w-2xl mx-auto">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Font Family
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { value: "Inter", label: "Inter" },
                          { value: "Roboto", label: "Roboto" },
                          { value: "Open Sans", label: "Open Sans" },
                          { value: "Lato", label: "Lato" },
                          { value: "Montserrat", label: "Montserrat" },
                          { value: "Poppins", label: "Poppins" },
                        ].map((font) => (
                          <button
                            key={font.value}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                layout: {
                                  ...formData.layout,
                                  font: font.value,
                                },
                              })
                            }
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.layout.font === font.value
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            style={{ fontFamily: font.value }}
                          >
                            <div className="text-sm font-medium text-gray-900">
                              {font.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end mt-10">
                      <button
                        type="button"
                        className="px-4 py-2 flex items-center gap-2 bg-yellow-50 text-yellow-500 rounded-lg font-medium hover:bg-yellow-500 hover:text-white transition-colors text-sm border-2 border-yellow-500"
                        onClick={async () => {
                          await handleSave();
                          setShowConfetti(true);
                          setShowCongrats(true);
                        }}
                      >
                        {saving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                    {/* Fixed Save Button */}
                    {/* <div className="fixed bottom-0 left-0 w-full flex justify-center z-40 pointer-events-none">
                      <div className="w-full max-w-xl px-4 py-6 flex justify-center pointer-events-auto">
                        <button
                          type="button"
                          className="px-10 py-3 rounded-full font-bold text-lg text-white bg-gradient-to-r from-pink-500 via-blue-500 to-green-400 shadow-lg transition-all duration-200 hover:scale-105 hover:from-pink-600 hover:to-green-500 focus:outline-none focus:ring-4 focus:ring-blue-200"
                          onClick={async () => {
                            await handleSave();
                            setShowConfetti(true);
                            setShowCongrats(true);
                          }}
                        >
                          Save & Celebrate
                        </button>
                      </div>
                    </div> */}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CardPreview
                formData={formData}
                socialLinks={socialLinks}
                mediaItems={mediaItems}
                reviews={reviews}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
