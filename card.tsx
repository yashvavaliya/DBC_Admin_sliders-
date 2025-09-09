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
  Download,
  QrCode,
  Share2,
  Facebook,
  Youtube,
  MessageCircle,
  MapPin,
  Star,
  ExternalLink,
  Play,
  Camera,
  User,
  Building,
  Briefcase,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { exportToPNG, exportToPDF, generateQRCode } from "../utils/exportUtils";
import { generateSocialLink } from "../utils/socialUtils";
import type { Database } from "../lib/supabase";
import ReactModal from "react-modal";

type BusinessCard = Database["public"]["Tables"]["business_cards"]["Row"];
type SocialLink = Database["public"]["Tables"]["social_links"]["Row"];

interface CardData {
  card: BusinessCard;
  socialLinks: SocialLink[];
  mediaItems: any[];
  reviews: any[];
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
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeVideo, setActiveVideo] = useState<number>(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardId) {
      loadCardData();
      trackCardView();
    }
  }, [cardId]);

  const loadCardData = async () => {
    if (!cardId) return;

    try {
      setLoading(true);

      // Fetch business card
      const { data: cardData, error: cardError } = await supabase
        .from("business_cards")
        .select("*")
        .eq("slug", cardId)
        .eq("is_published", true)
        .single();

      if (cardError) {
        throw new Error("Card not found or not published");
      }

      // Fetch social links
      const { data: socialLinks, error: socialError } = await supabase
        .from("social_links")
        .select("*")
        .eq("card_id", cardData.id)
        .eq("is_active", true)
        .order("display_order");

      if (socialError) {
        console.error("Social links error:", socialError);
      }

      // Fetch media items
      const { data: mediaItems } = await supabase
        .from("media_items")
        .select("*")
        .eq("card_id", cardData.id)
        .eq("is_active", true)
        .order("display_order");

      // Fetch review links
      const { data: reviewLinks } = await supabase
        .from("review_links")
        .select("*")
        .eq("card_id", cardData.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      setCardData({
        card: cardData,
        socialLinks: socialLinks || [],
        mediaItems: mediaItems || [],
        reviews: reviewLinks || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load card");
    } finally {
      setLoading(false);
    }
  };

  const trackCardView = async () => {
    if (!cardId) return;

    try {
      // Get card ID from slug
      const { data: card } = await supabase
        .from("business_cards")
        .select("id")
        .eq("slug", cardId)
        .single();

      if (card) {
        // Track the view
        await supabase.from("card_views").insert({
          card_id: card.id,
          visitor_ip: null, // We can't get IP in browser
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
            ? "mobile"
            : "desktop",
        });

        // Update view count
        await supabase
          .from("business_cards")
          .update({ view_count: (cardData?.card.view_count || 0) + 1 })
          .eq("id", card.id);
      }
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const handleExportPNG = async () => {
    if (cardRef.current) {
      await exportToPNG(
        cardRef.current,
        `${cardData?.card.title || "business-card"}.png`
      );
    }
  };

  const handleExportPDF = async () => {
    if (cardRef.current) {
      await exportToPDF(
        cardRef.current,
        `${cardData?.card.title || "business-card"}.pdf`
      );
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${cardData?.card.title}'s Digital Business Card`;
    const text = `Connect with ${cardData?.card.title} through their digital business card`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // User cancelled or error occurred, fallback to copy
        await navigator.clipboard.writeText(url);
        setShowShareModal(true);
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShowShareModal(true);
    }
  };

  // Helper to get YouTube thumbnail
  const getYoutubeThumbnail = (url: string) => {
    let videoId = "";
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1]?.split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    }
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
  };

  // Helper to get video embed URL
  const getVideoEmbedUrl = (url: string) => {
    // YouTube
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Vimeo
    if (url.includes("vimeo.com/")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }

    return null;
  };

  // Helper to check if YouTube/Vimeo
  const isYoutube = (url: string) =>
    url.includes("youtube.com/watch?v=") || url.includes("youtu.be/");
  const isVimeo = (url: string) => url.includes("vimeo.com/");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            Loading digital business card...
          </p>
        </div>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Card Not Found
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {error ||
              "This digital business card does not exist or is not published yet."}
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              If you're the owner of this card, make sure it's published in your
              admin panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { card, socialLinks, mediaItems, reviews } = cardData;
  const theme = (card.theme as any) || {
    primary: "#3B82F6",
    secondary: "#1E40AF",
    background: "#FFFFFF",
    text: "#1F2937",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="min-h-screen flex items-center justify-center p-2">
          <div className="w-full max-w-7xl grid grid-cols-12 gap-8 items-start">
            {/* Left Column - Main Card */}
            <div className="col-span-4">
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
                {/* Profile Image */}
                {card.avatar_url ? (
                  <img
                    src={card.avatar_url}
                    alt={card.title || "Profile"}
                    className="w-32 h-32 rounded-full object-cover mb-6 border-4 shadow-lg"
                    style={{ borderColor: theme.primary }}
                  />
                ) : (
                  <div
                    className="w-32 h-32 rounded-full mb-6 flex items-center justify-center text-white font-bold text-3xl border-4 shadow-lg"
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

                {/* Name and Company */}
                <div className="mb-6">
                  <h1
                    className="text-3xl font-bold mb-2"
                    style={{ color: theme.text }}
                  >
                    {card.title || "Your Name"}
                  </h1>
                  {card.position && (
                    <p
                      className="text-lg font-semibold mb-1"
                      style={{ color: theme.secondary }}
                    >
                      {card.position}
                    </p>
                  )}
                  {card.company && (
                    <p
                      className="text-base opacity-90 mb-2"
                      style={{ color: theme.text }}
                    >
                      {card.company}
                    </p>
                  )}
                  {card.bio && (
                    <p
                      className="text-sm opacity-75 leading-relaxed"
                      style={{ color: theme.text }}
                    >
                      {card.bio}
                    </p>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-3 mb-6">
                  {card.email && (
                    <a
                      href={`mailto:${card.email}`}
                      className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-black hover:bg-opacity-10 hover:scale-105"
                    >
                      <Mail
                        className="w-5 h-5"
                        style={{ color: theme.primary }}
                      />
                      <span className="text-sm font-medium">{card.email}</span>
                    </a>
                  )}
                  {card.phone && (
                    <a
                      href={`tel:${card.phone}`}
                      className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-black hover:bg-opacity-10 hover:scale-105"
                    >
                      <Phone
                        className="w-5 h-5"
                        style={{ color: theme.primary }}
                      />
                      <span className="text-sm font-medium">{card.phone}</span>
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
                      className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-black hover:bg-opacity-10 hover:scale-105"
                    >
                      <MessageCircle
                        className="w-5 h-5"
                        style={{ color: theme.primary }}
                      />
                      <span className="text-sm font-medium">WhatsApp</span>
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
                      className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-black hover:bg-opacity-10 hover:scale-105"
                    >
                      <Globe
                        className="w-5 h-5"
                        style={{ color: theme.primary }}
                      />
                      <span className="text-sm font-medium">
                        {card.website}
                      </span>
                    </a>
                  )}
                  {card.address && (
                    <div className="flex items-start gap-3 p-3 rounded-lg">
                      <MapPin
                        className="w-5 h-5 mt-0.5"
                        style={{ color: theme.primary }}
                      />
                      <span className="text-sm">{card.address}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {socialLinks.length > 0 && (
                  <div className="space-y-2">
                    <h3
                      className="text-sm font-semibold mb-3"
                      style={{ color: theme.secondary }}
                    >
                      Connect with me
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {socialLinks.map((link) => {
                        const Icon = SOCIAL_ICONS[link.platform] || Globe;
                        return (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 rounded-lg transition-all duration-200 hover:bg-black hover:bg-opacity-10 hover:scale-105"
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: theme.primary }}
                            >
                              <Icon className="w-4 h-4 text-white" />
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
                )}
              </div>
            </div>

            {/* Middle Column - Videos */}
            {mediaItems && mediaItems.length > 0 && (
              <div className="col-span-4">
                <div
                  className={`w-full p-8 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                  style={{
                    backgroundColor: theme.background,
                    color: theme.text,
                    fontFamily: `'${layout.font}', sans-serif`,
                    borderColor: theme.primary + "50",
                  }}
                >
                  <h2
                    className="text-xl font-semibold mb-6 flex items-center gap-2"
                    style={{ color: theme.secondary }}
                  >
                    <Play  />
                    Videos
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {mediaItems.slice(0, 2).map((item, idx) => (
                      <button
                        key={item.id}
                        className="relative rounded-lg overflow-hidden focus:outline-none group"
                        onClick={() => {
                          setActiveVideo(idx);
                          setShowVideoModal(true);
                        }}
                        style={{ aspectRatio: "16/9", background: "#eee" }}
                      >
                        {isYoutube(item.url) ? (
                          <img
                            src={getYoutubeThumbnail(item.url)}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Play className="w-10 h-10 text-gray-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                  {mediaItems.length > 2 && (
                    <div className="text-center mt-3">
                      <button
                        className={`flex items-center gap-2 p-3 rounded-lg transition-all duration-200 hover:bg-black hover:bg-opacity-10 hover:scale-105 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                        style={{
                          fontFamily: `'${layout.font}', sans-serif`,
                          borderColor: theme.primary + "50",
                        }}
                        onClick={() => {
                          setActiveVideo(0);
                          setShowVideoModal(true);
                        }}
                      >
                        View All Videos
                      </button>
                    </div>
                  )}

                  {/* Video Gallery Modal */}
                  <ReactModal
                    isOpen={showVideoModal}
                    onRequestClose={() => setShowVideoModal(false)}
                    className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80"
                    overlayClassName="fixed inset-0 bg-black bg-opacity-80"
                    ariaHideApp={false}
                  >
                    <div className="bg-white rounded-lg p-4 max-w-2xl w-full relative">
                      <button
                        className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 transition-colors shadow-lg z-10"
                        style={{ border: "none" }}
                        onClick={() => setShowVideoModal(false)}
                        aria-label="Close"
                      >
                        <span className="text-2xl text-gray-600 hover:text-red-600 leading-none">
                          &times;
                        </span>
                      </button>
                      <div className="flex flex-col items-center">
                        {mediaItems.map((item, idx) =>
                          idx === activeVideo ? (
                            <div
                              key={item.id}
                              className="w-full aspect-video mb-4"
                            >
                              {isYoutube(item.url) ? (
                                <iframe
                                  src={`https://www.youtube.com/embed/${
                                    item.url.includes("youtube.com/watch?v=")
                                      ? item.url.split("v=")[1]?.split("&")[0]
                                      : item.url
                                          .split("youtu.be/")[1]
                                          ?.split("?")[0]
                                  }`}
                                  title={item.title}
                                  className="w-full h-full rounded"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : isVimeo(item.url) ? (
                                <iframe
                                  src={`https://player.vimeo.com/video/${
                                    item.url
                                      .split("vimeo.com/")[1]
                                      ?.split("?")[0]
                                  }`}
                                  title={item.title}
                                  className="w-full h-full rounded"
                                  frameBorder="0"
                                  allow="autoplay; fullscreen; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full h-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                                >
                                  <Play className="w-8 h-8 text-gray-600" />
                                </a>
                              )}
                            </div>
                          ) : null
                        )}
                        <div className="flex gap-2 flex-wrap justify-center">
                          {mediaItems.map((item, idx) => (
                            <button
                              key={item.id}
                              className={`w-16 h-10 rounded overflow-hidden border-2 ${
                                idx === activeVideo
                                  ? "border-blue-600"
                                  : "border-transparent"
                              }`}
                              onClick={() => setActiveVideo(idx)}
                            >
                              {isYoutube(item.url) ? (
                                <img
                                  src={getYoutubeThumbnail(item.url)}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <Play className="w-5 h-5 text-gray-600" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ReactModal>
                </div>
              </div>
            )}

            {/* Right Column - Reviews */}
            {reviews && reviews.length > 0 && (
              <div className="col-span-4">
                <div
                  className={`w-full p-8 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                  style={{
                    backgroundColor: theme.background,
                    color: theme.text,
                    fontFamily: `'${layout.font}', sans-serif`,
                    borderColor: theme.primary + "50",
                  }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-600" />
                    Review
                  </h2>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <a
                        key={review.id}
                        href={review.review_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-300 transition-all duration-200 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl flex items-center justify-center">
                            <Star className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                              {review.title}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              Click to view reviews
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Action Buttons */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-3">
          <button
            onClick={() => setShowQR(true)}
            className="w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 hover:scale-110 transition-all duration-200 flex items-center justify-center"
            title="Show QR Code"
          >
            <QrCode className="w-6 h-6" />
          </button>
          <button
            onClick={handleShare}
            className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transition-all duration-200 flex items-center justify-center"
            title="Share Card"
          >
            <Share2 className="w-6 h-6" />
          </button>
          <button
            onClick={handleExportPNG}
            className="w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 hover:scale-110 transition-all duration-200 flex items-center justify-center"
            title="Download PNG"
          >
            <Download className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-6 px-4">
          {/* Mobile Header
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Digital Business Card
            </h1>
            <p className="text-gray-600">Connect with {card.title}</p>
          </div> */}

          {/* Mobile Card */}
          <div className="space-y-6">
            {/* Main Profile Card */}
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
              {/* Profile Image */}
              {card.avatar_url ? (
                <img
                  src={card.avatar_url}
                  alt={card.title || "Profile"}
                  className="w-24 h-24 rounded-full object-cover mb-4 border-4 shadow-lg"
                  style={{ borderColor: theme.primary }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full mb-4 flex items-center justify-center text-white font-bold text-2xl border-4 shadow-lg"
                  style={{
                    backgroundColor: theme.primary,
                    borderColor: theme.secondary,
                  }}
                >
                  {card.title ? (
                    card.title.charAt(0).toUpperCase()
                  ) : (
                    <Camera className="w-8 h-8" />
                  )}
                </div>
              )}

              {/* Name and Company */}
              <div className="mb-6">
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: theme.text }}
                >
                  {card.title || "Your Name"}
                </h2>
                {card.position && (
                  <p
                    className="text-lg font-semibold mb-1"
                    style={{ color: theme.secondary }}
                  >
                    {card.position}
                  </p>
                )}
                {card.company && (
                  <p
                    className="text-base opacity-90 mb-2"
                    style={{ color: theme.text }}
                  >
                    {card.company}
                  </p>
                )}
                {card.bio && (
                  <p
                    className="text-sm opacity-75 leading-relaxed"
                    style={{ color: theme.text }}
                  >
                    {card.bio}
                  </p>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                {card.email && (
                  <a
                    href={`mailto:${card.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-black hover:bg-opacity-10"
                  >
                    <Mail
                      className="w-5 h-5"
                      style={{ color: theme.primary }}
                    />
                    <span className="text-sm font-medium">{card.email}</span>
                  </a>
                )}
                {card.phone && (
                  <a
                    href={`tel:${card.phone}`}
                    className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-black hover:bg-opacity-10"
                  >
                    <Phone
                      className="w-5 h-5"
                      style={{ color: theme.primary }}
                    />
                    <span className="text-sm font-medium">{card.phone}</span>
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
                    className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-black hover:bg-opacity-10"
                  >
                    <MessageCircle
                      className="w-5 h-5"
                      style={{ color: theme.primary }}
                    />
                    <span className="text-sm font-medium">WhatsApp</span>
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
                    className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-black hover:bg-opacity-10"
                  >
                    <Globe
                      className="w-5 h-5"
                      style={{ color: theme.primary }}
                    />
                    <span className="text-sm font-medium">{card.website}</span>
                  </a>
                )}
                {card.address && (
                  <div className="flex items-start gap-3 p-3 rounded-lg">
                    <MapPin
                      className="w-5 h-5 mt-0.5"
                      style={{ color: theme.primary }}
                    />
                    <span className="text-sm">{card.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Social Links */}
            {socialLinks.length > 0 && (
              <div
                className={`w-full p-6 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontFamily: `'${layout.font}', sans-serif`,
                  borderColor: theme.primary + "50",
                }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Social Media
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {socialLinks.map((link) => {
                    const Icon = SOCIAL_ICONS[link.platform] || Globe;
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: theme.primary }}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {link.platform}
                          </div>
                          {link.username && (
                            <div className="text-xs text-gray-500">
                              @{link.username}
                            </div>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mobile Videos */}
            {mediaItems && mediaItems.length > 0 && (
              <div
                className={`w-full p-6 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontFamily: `'${layout.font}', sans-serif`,
                  borderColor: theme.primary + "50",
                }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5 text-red-600" />
                  Videos
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {mediaItems.slice(0, 2).map((item, idx) => (
                    <button
                      key={item.id}
                      className="relative rounded-lg overflow-hidden focus:outline-none group"
                      onClick={() => {
                        setActiveVideo(idx);
                        setShowVideoModal(true);
                      }}
                      style={{ aspectRatio: "16/9", background: "#eee" }}
                    >
                      {isYoutube(item.url) ? (
                        <img
                          src={getYoutubeThumbnail(item.url)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Play className="w-10 h-10 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
                {mediaItems.length > 2 && (
                  <div className="text-center mt-3">
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      onClick={() => {
                        setActiveVideo(0);
                        setShowVideoModal(true);
                      }}
                    >
                      View All Videos
                    </button>
                  </div>
                )}

                {/* Video Gallery Modal */}
                <ReactModal
                  isOpen={showVideoModal}
                  onRequestClose={() => setShowVideoModal(false)}
                  className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-80"
                  overlayClassName="fixed inset-0 bg-black bg-opacity-80"
                  ariaHideApp={false}
                >
                  <div className="bg-white rounded-lg p-2 max-w-2xl w-full relative mx-4 sm:mx-8">
                    <button
                      className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 transition-colors shadow-lg z-10"
                      style={{ border: "none" }}
                      onClick={() => setShowVideoModal(false)}
                      aria-label="Close"
                    >
                      <span className="text-3xl text-gray-600 hover:text-red-600 leading-none mb-1 ">
                        &times;
                      </span>
                    </button>
                    <div className="flex flex-col items-center">
                      {mediaItems.map((item, idx) =>
                        idx === activeVideo ? (
                          <div
                            key={item.id}
                            className="w-full aspect-video mb-2"
                          >
                            {isYoutube(item.url) ? (
                              <iframe
                                src={`https://www.youtube.com/embed/${
                                  item.url.includes("youtube.com/watch?v=")
                                    ? item.url.split("v=")[1]?.split("&")[0]
                                    : item.url
                                        .split("youtu.be/")[1]
                                        ?.split("?")[0]
                                }`}
                                title={item.title}
                                className="w-full h-full rounded"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : isVimeo(item.url) ? (
                              <iframe
                                src={`https://player.vimeo.com/video/${
                                  item.url.split("vimeo.com/")[1]?.split("?")[0]
                                }`}
                                title={item.title}
                                className="w-full h-full rounded"
                                frameBorder="0"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                              >
                                <Play className="w-8 h-8 text-gray-600" />
                              </a>
                            )}
                          </div>
                        ) : null
                      )}
                      <div className="flex gap-2 flex-wrap justify-center">
                        {mediaItems.map((item, idx) => (
                          <button
                            key={item.id}
                            className={`w-16 h-10 rounded overflow-hidden border-2 ${
                              idx === activeVideo
                                ? "border-blue-600"
                                : "border-transparent"
                            }`}
                            onClick={() => setActiveVideo(idx)}
                          >
                            {isYoutube(item.url) ? (
                              <img
                                src={getYoutubeThumbnail(item.url)}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <Play className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </ReactModal>
              </div>
            )}

            {/* Mobile Reviews */}
            {reviews && reviews.length > 0 && (
              <div
                className={`w-full p-6 ${getCardShapeClasses()} ${getStyleClasses()} ${getLayoutClasses()}`}
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  fontFamily: `'${layout.font}', sans-serif`,
                  borderColor: theme.primary + "50",
                }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  Reviews & Testimonials
                </h3>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <a
                      key={review.id}
                      href={review.review_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-300 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl flex items-center justify-center">
                          <Star className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {review.title}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" />
                            Click to view reviews
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Action Buttons */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <button
                onClick={handleExportPNG}
                className="flex flex-col items-center gap-2 p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg"
              >
                <Download className="w-6 h-6" />
                <span className="text-sm font-medium">Download</span>
              </button>
              <button
                onClick={() => setShowQR(true)}
                className="flex flex-col items-center gap-2 p-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg"
              >
                <QrCode className="w-6 h-6" />
                <span className="text-sm font-medium">QR Code</span>
              </button>
              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-2 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
              >
                <Share2 className="w-6 h-6" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">QR Code</h3>
            <div className="flex justify-center mb-6 p-4 bg-gray-50 rounded-xl">
              {generateQRCode(window.location.href)}
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Scan this QR code to instantly share this digital business card
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQR(false)}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={handleExportPNG}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Success Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Link Copied!
            </h3>
            <p className="text-gray-600 mb-6">
              The card link has been copied to your clipboard. Share it with
              anyone!
            </p>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
