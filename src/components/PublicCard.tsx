import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Mail,
  Phone,
  Globe,
  Instagram,
  Linkedin,
  Github,
  Twitter,
  Facebook,
  Youtube,
  Camera,
  MessageCircle,
  MapPin,
  Star,
  ExternalLink,
  Play,
  FileText,
  
  Eye,
  Share2,
  Download,
  QrCode,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/supabase";
import { getSocialIcon, SOCIAL_PLATFORM_COLORS } from "../utils/socialUtils";

import html2canvas from "html2canvas";
import { QRCodeSVG } from "qrcode.react";

type BusinessCard = Database["public"]["Tables"]["business_cards"]["Row"];
type SocialLink = Database["public"]["Tables"]["social_links"]["Row"];

interface MediaItem {
  id: string;
  type: "image" | "video" | "document";
  url: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
}

interface ReviewLink {
  id: string;
  title: string;
  review_url: string;
  created_at: string;
}

const SOCIAL_ICONS: Record<string, React.ComponentType<any>> = {
  Instagram,
  LinkedIn: Linkedin,
  GitHub: Github,
  Twitter,
  Facebook,
  "You Tube": Youtube,
  YouTube: Youtube,
  Website: Globe,
  WhatsApp: MessageCircle,
  Telegram: MessageCircle,
  "Custom Link": ExternalLink,
};

export const PublicCard: React.FC = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [reviewLinks, setReviewLinks] = useState<ReviewLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardId) {
      loadCard();
    }
  }, [cardId]);

  const loadCard = async () => {
    if (!cardId) return;

    try {
      setLoading(true);
      setError(null);

      // Load card by slug (not by user ID)
      const { data: cardData, error: cardError } = await supabase
        .from("business_cards")
        .select("*")
        .eq("slug", cardId) // Use slug for lookup
        .eq("is_published", true) // Only show published cards
        .single();

      if (cardError) {
        console.error("Card error:", cardError);
        setError("Card not found or not published");
        return;
      }

      if (!cardData) {
        setError("Card not found");
        return;
      }

      setCard(cardData);

      // Load profile information
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", cardData.user_id); // Removed .single()

      if (profileError) {
        console.error("Profile error:", profileError);
      } else {
        if (profileData && profileData.length > 0) {
          setProfile(profileData[0]);
        } else {
          console.warn("No profile found for user_id:", cardData.user_id);
          setProfile(null);
        }
      }

      // Load social links
      const { data: socialData, error: socialError } = await supabase
        .from("social_links")
        .select("*")
        .eq("card_id", cardData.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (socialError) {
        console.error("Social links error:", socialError);
      } else {
        setSocialLinks(socialData || []);
      }

      // Load media items
      const { data: mediaData, error: mediaError } = await supabase
        .from("media_items")
        .select("*")
        .eq("card_id", cardData.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (mediaError) {
        console.error("Media error:", mediaError);
      } else {
        const formattedMedia: MediaItem[] = (mediaData || []).map((item) => ({
          id: item.id,
          type: item.type as "image" | "video" | "document",
          url: item.url,
          title: item.title,
          description: item.description || undefined,
          thumbnail_url: item.thumbnail_url || undefined,
        }));
        setMediaItems(formattedMedia);
      }

      // Load review links
      const { data: reviewData, error: reviewError } = await supabase
        .from("review_links")
        .select("*")
        .eq("card_id", cardData.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (reviewError) {
        console.error("Review links error:", reviewError);
      } else {
        const formattedReviews: ReviewLink[] = (reviewData || []).map(
          (item) => ({
            id: item.id,
            title: item.title,
            review_url: item.review_url,
            created_at: item.created_at,
          })
        );
        setReviewLinks(formattedReviews);
      }

      // Track view (increment view count)
      await trackCardView(cardData.id);
    } catch (error) {
      console.error("Error loading card:", error);
      setError("Failed to load card");
    } finally {
      setLoading(false);
    }
  };

  const trackCardView = async (cardId: string) => {
    try {
      // Increment view count
      const { error: updateError } = await supabase
        .from("business_cards")
        .update({
          view_count: card ? (card.view_count || 0) + 1 : 1,
        })
        .eq("id", cardId);

      if (updateError) {
        console.error("Error updating view count:", updateError);
      }

      // Add analytics record
      const { error: analyticsError } = await supabase
        .from("card_analytics")
        .insert({
          card_id: cardId,
          visitor_ip: null, // Would need server-side implementation for real IP
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
            ? "mobile"
            : "desktop",
        });

      if (analyticsError) {
        console.error("Error tracking analytics:", analyticsError);
      }
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const handleDownload = async () => {
    const cardElement = document.getElementById("public-card-content");
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `${card?.slug || "business-card"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error downloading card:", error);
      alert("Failed to download card. Please try again.");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${card?.title || "Business Card"} - ${
            card?.company || "Professional"
          }`,
          text: `Check out ${card?.title || "this"}'s digital business card`,
          url: url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Link copied to clipboard!");
      })
      .catch(() => {
        alert("Failed to copy link");
      });
  };

  const getVideoThumbnail = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return null;
  };

  const getVideoEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("vimeo.com/")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business card...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Card Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error ||
              "The business card you're looking for doesn't exist or has been unpublished."}
          </p>
          <p className="text-sm text-gray-500">
            If you're the owner of this card, make sure it's published in your
            admin panel.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const theme = (card.theme as any) || {
    primary: "#3B82F6",
    secondary: "#1E40AF",
    background: "#FFFFFF",
    text: "#1F2937",
    name: "Default",
  };

  const layout = (card.layout as any) || {
    style: "modern",
    alignment: "center",
    font: "Inter",
  };

  const getCardShapeClasses = () => {
    switch (card.shape) {
      case "rounded":
        return "rounded-3xl";
      case "circle":
        return "rounded-full aspect-square";
      case "hexagon":
        return "rounded-3xl";
      default:
        return "rounded-2xl";
    }
  };

  const getLayoutClasses = () => {
    const baseClasses = "flex flex-col";
    switch (layout.alignment) {
      case "left":
        return `${baseClasses} items-start text-left`;
      case "right":
        return `${baseClasses} items-end text-right`;
      default:
        return `${baseClasses} items-center text-center`;
    }
  };

  const getStyleClasses = () => {
    switch (layout.style) {
      case "classic":
        return "border-2 shadow-xl";
      case "minimal":
        return "border border-gray-200 shadow-lg";
      case "creative":
        return "shadow-2xl transform hover:scale-105 transition-transform duration-300";
      default:
        return "shadow-2xl border border-gray-100";
    }
  };

  const cardUrl = window.location.href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Actions */}
      {/* <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-semibold text-gray-900">
                {card.title || "Business Card"}
              </h1>
              <p className="text-sm text-gray-500">
                {card.company || "Professional"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            <button
              onClick={() => setShowQR(!showQR)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Show QR Code"
            >
              <QrCode className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share Card"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download Card"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div> */}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Scan to View Card
              </h3>
              <div className="flex justify-center mb-4">
                <QRCodeSVG
                  value={cardUrl}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code to quickly access this business card
              </p>
              <button
                onClick={() => setShowQR(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="py-8 px-4" id="public-card-content">
        <div className="max-w-6xl mx-auto">
          {/* Main Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Profile Section */}
            <div className="lg:col-span-1">
              <div
                ref={cardRef}
                className={`w-full p-8 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontFamily: `'${layout.font}', sans-serif`,
                  borderColor: theme.primary + "50",
                }}
              >
                {/* Avatar */}
                {card.avatar_url ? (
                  <img
                    src={card.avatar_url}
                    alt="Profile"
                    className="w-36 h-36 rounded-full object-cover mx-auto mb-6 border-4"
                    style={{ borderColor: theme.primary }}
                  />
                ) : (
                  <div
                    className="w-36 h-36 rounded-full mx-auto mb-6 flex items-center justify-center text-white font-bold text-3xl border-4"
                    style={{
                      backgroundColor: theme.primary,
                      borderColor: theme.secondary,
                    }}
                  >
                    {card.title ? (
                      card.title.charAt(0).toUpperCase()
                    ) : (
                      <Camera className="w-12 h-12" />
                    )}
                  </div>
                )}

                {/* Name and Bio */}
                <div className="mb-6">
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{ color: theme.text }}
                  >
                    {card.title || "Professional"}
                  </h2>
                  {card.position && card.company && (
                    <p
                      className="text-lg font-medium mb-1"
                      style={{ color: theme.secondary }}
                    >
                      {card.position} at {card.company}
                    </p>
                  )}
                  {card.position && !card.company && (
                    <p
                      className="text-lg font-medium mb-1"
                      style={{ color: theme.secondary }}
                    >
                      {card.position}
                    </p>
                  )}
                  {!card.position && card.company && (
                    <p
                      className="text-lg font-medium mb-1"
                      style={{ color: theme.secondary }}
                    >
                      {card.company}
                    </p>
                  )}
                  {/* {card.position && (
                    <p
                      className="text-lg font-medium mb-1"
                      style={{ color: theme.secondary }}
                    >
                      {card.position}
                    </p>
                  )}
                  
                  {card.company && (
                    <p
                      className="text-base opacity-80 mb-2"
                      style={{ color: theme.text }}
                    >
                      {card.company}
                    </p>
                  )} */}                  
                    {card.bio && (
                    <p
                      className="text-sm opacity-70"
                      style={{ color: theme.text }}
                    >
                      {card.bio}
                    </p>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-3 mb-6">
                  <a
                    href={`mailto:${card.email}`}
                    className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md transition-shadow group"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{card.email}</p>
                    </div>
                  </a>

                   {card.address &&
                    (card.map_link && typeof card.map_link === "string" && card.map_link.trim() !== "" ? (
                      <a
                        href={card.map_link as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md transition-shadow group"
                      >
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{card.address}</p>
                        </div>
                      </a>
                    ) : (
                      <p className="text-sm mb-2">{card.address}</p>
                    )
                  )}

                  {card.phone && (
                    <a
                      href={`tel:${card.phone}`}
                      className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md transition-shadow group"
                    >
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{card.phone}</p>
                      </div>
                    </a>
                  )}

                  {card.whatsapp && (
                    <a
                      href={`https://wa.me/${card.whatsapp.replace(
                        /[^0-9]/g,
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md transition-shadow group"
                    >
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Send message</p>
                      </div>
                    </a>
                  )}

                  {card.website && (
                    <a
                      href={
                        card.website.startsWith("http")
                          ? card.website
                          : `https://${card.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 border border-gray-200 rounded-xl hover:shadow-md transition-shadow group"
                    >
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{card.website}</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Actions */}
              <div
                ref={cardRef}
                className={`w-full p-6 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontFamily: `'${layout.font}', sans-serif`,
                  borderColor: theme.primary + "50",
                }}
              >
                <h3 className="text-xl font-semibold mb-4" style={{ color: theme.text }}>
                  Get In Touch
                </h3>
               
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {socialLinks.map(link => {
                    const Icon = getSocialIcon(link.platform);
                    const color = SOCIAL_PLATFORM_COLORS[link.platform] || "#333";
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-lg transition-all duration-200 hover:bg-black hover:bg-opacity-10 hover:scale-105"
                      >
                        <div
                          className={`w-10 h-10 flex items-center justify-center rounded-full ${link.platform === "GitHub" ? "bg-gray-200" : ""}`}
                          style={link.platform !== "GitHub" ? { background: color + "33" } : undefined}
                        >
                          <Icon className="text-2xl" color={color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {link.platform}
                          </div>
                          {link.username && (
                            <div className="text-xs opacity-75 truncate">
                              @{link.username}
                            </div>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Media Gallery */}
              {mediaItems.length > 0 && (
                <div
                  ref={cardRef}
                  className={`w-full p-6 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                  style={{
                    backgroundColor: theme.background,
                    color: theme.text,
                    fontFamily: `'${layout.font}', sans-serif`,
                    borderColor: theme.primary + "50",
                  }}
                >
                  <h3
                    className="text-xl font-semibold mb-4 flex items-center gap-2"
                    style={{ color: theme.text }}
                  >
                    <Play className="w-5 h-5 text-blue-600" />
                    Media Gallery
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {mediaItems.map((item) => (
                      <div
                        key={item.id}
                        className="relative group flex-shrink-0 aspect-video"
                      >
                        {item.type === "video" ? (
                          <div className="relative aspect-video">
                            {getVideoThumbnail(item.url) ? (
                              <img
                                src={getVideoThumbnail(item.url)!}
                                alt={item.title}
                                className="w-full h-40 md:h-40 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                <Play className="w-10 h-10 text-gray-600" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-10 rounded-lg flex items-center justify-center">
                              <Play className="w-10 h-10 text-white" />
                            </div>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 rounded-lg"
                            />
                          </div>
                        ) : item.type === "image" ? (
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center ">
                            <FileText className="w-12 h-12 text-gray-600 mb-2" />
                            <span className="text-sm text-gray-600">
                              {item.title}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Links */}
              {reviewLinks.length > 0 && (
                <div
                  ref={cardRef}
                  className={`w-full p-6 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                  style={{
                    backgroundColor: theme.background,
                    color: theme.text,
                    fontFamily: `'${layout.font}', sans-serif`,
                    borderColor: theme.primary + "50",
                  }}
                >
                  <h3
                    className="text-xl font-semibold mb-4 flex items-center gap-2"
                    style={{ color: theme.text }}
                  >
                    <Star className="w-5 h-5 text-yellow-600" />
                    Reviews
                  </h3>
                  <div className="">
                    {reviewLinks.map((review) => (
                      <a
                        key={review.id}
                        href={review.review_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-600 group-hover:text-blue-600 transition-colors" >
                              {review.title}
                            </h4>
                            <p className="text-sm" style={{ color: theme.text }}>
                              View our customer reviews
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-5">
            <p className="text-gray-500 text-sm">
              Powered by Digital Business Cards
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Action Buttons */}
      <div className="fixed bottom-8 right-8 flex-col gap-3 hidden lg:flex">
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 hover:scale-110 transition-all duration-200 flex items-center justify-center"
          title="Show QR Code"
        >
          <QrCode className="w-7 h-7  " />
        </button>
        <button
          onClick={handleShare}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transition-all duration-200 flex items-center justify-center"
          title="Share Card"
        >
          <Share2 className="w-6 h-6" />
        </button>
        <button
          onClick={handleDownload}
          className="w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 hover:scale-110 transition-all duration-200 flex items-center justify-center"
          title="Download PNG"
        >
          <Download className="w-7 h-7" />
        </button>
      </div>

      {/* Mobile Action Buttons */}
      <div className="grid grid-cols-3 gap-2 p-4 mt-5 flex lg:hidden">
        <button
          onClick={handleDownload}
          className="flex flex-col items-center gap-2 p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg"
        >
          <Download className="w-8 h-8" />
          {/* <span className="text-sm font-medium">Download</span> */}
        </button>
        <button
          onClick={() => setShowQR(true)}
          className="flex flex-col items-center gap-2 p-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg"
        >
          <QrCode className="w-8 h-8" />
          {/* <span className="text-sm font-medium">QR Code</span> */}
        </button>
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-2 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
        >
          <Share2 className="w-8 h-8" />
          {/* <span className="text-sm font-medium">Share</span> */}
        </button>
      </div>
    </div>
  );
};
