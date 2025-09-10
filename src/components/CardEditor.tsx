import React, { useState, useEffect } from 'react';
import { Save, Eye, ArrowLeft, Palette, Type, Layout, Share2, Globe, Lock, AlertCircle, Upload, Download, Copy, Trash2, Plus, Settings, Zap, Sparkles, RefreshCw, FolderSync as Sync, Check, ArrowBigRight, Mail, Phone, MapPin, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ImageUpload } from './ImageUpload';
import { CardPreview } from './CardPreview';
import { MediaUpload } from './MediaUpload';
import { ReviewsManager } from './ReviewsManager';
import { generateSocialLink, SOCIAL_PLATFORMS, generateAutoSyncedLinks, getSocialIcon, SOCIAL_PLATFORM_COLORS } from '../utils/socialUtils';
import { SuccessAnimation } from './SuccessAnimation';
import type { Database } from '../lib/supabase';

type BusinessCard = Database['public']['Tables']['business_cards']['Row'];
type SocialLink = Database['public']['Tables']['social_links']['Row'];

interface CardEditorProps {
  existingCard?: BusinessCard | null;
  onSave: () => void;
  onCancel: () => void;
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
  { name: 'Ocean Blue', primary: '#3B82F6', secondary: '#1E40AF', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Forest Green', primary: '#10B981', secondary: '#047857', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Sunset Orange', primary: '#F59E0B', secondary: '#D97706', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Royal Purple', primary: '#8B5CF6', secondary: '#7C3AED', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Rose Pink', primary: '#EC4899', secondary: '#DB2777', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Dark Mode', primary: '#60A5FA', secondary: '#3B82F6', background: '#1F2937', text: '#F9FAFB' },
  { name: 'Emerald', primary: '#059669', secondary: '#047857', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Indigo', primary: '#4F46E5', secondary: '#3730A3', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Teal', primary: '#0D9488', secondary: '#0F766E', background: '#FFFFFF', text: '#1F2937' },
  { name: 'Amber', primary: '#D97706', secondary: '#B45309', background: '#FFFFFF', text: '#1F2937' },
];

// Confetti Animation Component
const ConfettiAnimation: React.FC = () => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    rotation: number;
    velocity: { x: number; y: number };
  }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -10,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'][Math.floor(Math.random() * 5)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      velocity: {
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 3 + 2
      }
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            backgroundColor: particle.color,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            borderRadius: '50%',
            transform: `rotate(${particle.rotation}deg)`,
            animation: `fall 3s ease-out forwards, rotate 3s linear infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const CardEditor: React.FC<CardEditorProps> = ({ existingCard, onSave, onCancel }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'social' | 'media' | 'reviews' | 'design'>('basic');
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [businessCard, setBusinessCard] = useState<BusinessCard | null>(existingCard || null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [newSocialLink, setNewSocialLink] = useState({ platform: '', username: '' });

  const [formData, setFormData] = useState<FormData>({
    title: existingCard?.title || '',
    username: existingCard?.slug || '',
    globalUsername: '',
    company: existingCard?.company || '',
    tagline: existingCard?.bio || '',
    profession: existingCard?.position || '',
    avatar_url: existingCard?.avatar_url || '',
    phone: existingCard?.phone || '',
    whatsapp: existingCard?.whatsapp || '',
    email: existingCard?.email || user?.email || '',
    website: existingCard?.website || '',
    address: existingCard?.address || '',
    map_link: existingCard?.map_link || '',
    theme: (existingCard?.theme as any) || THEMES[0],
    shape: existingCard?.shape || 'rectangle',
    layout: (existingCard?.layout as any) || { style: 'modern', alignment: 'center', font: 'Inter' },
    is_published: existingCard?.is_published || false,
  });

  useEffect(() => {
    if (existingCard) {
      loadCardData();
    }
  }, [existingCard]);

  useEffect(() => {
    if (showCongrats) {
      const timer = setTimeout(() => {
        setShowCongrats(false);
        setShowConfetti(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showCongrats]);

  const loadCardData = async () => {
    if (!existingCard) return;

    try {
      // Load social links
      const { data: socialData } = await supabase
        .from('social_links')
        .select('*')
        .eq('card_id', existingCard.id)
        .order('display_order');

      if (socialData) {
        setSocialLinks(socialData);
      }
    } catch (error) {
      console.error('Error loading card data:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const cardData = {
        user_id: user.id,
        title: formData.title,
        company: formData.company,
        position: formData.profession,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        avatar_url: formData.avatar_url,
        bio: formData.tagline,
        whatsapp: formData.whatsapp,
        address: formData.address,
        map_link: formData.map_link,
        theme: formData.theme,
        shape: formData.shape,
        layout: formData.layout,
        is_published: formData.is_published,
        slug: formData.username || null,
      };

      let result;
      if (existingCard) {
        // Update existing card
        result = await supabase
          .from('business_cards')
          .update(cardData)
          .eq('id', existingCard.id)
          .select()
          .single();
      } else {
        // Create new card
        result = await supabase
          .from('business_cards')
          .insert(cardData)
          .select()
          .single();
      }

      if (result.error) {
        console.error('Error saving card:', result.error);
        alert('Failed to save card. Please try again.');
        return;
      }

      if (result.data) {
        setBusinessCard(result.data);
      }

      return result.data;
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Failed to save card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalUsernameChange = (username: string) => {
    setFormData({ ...formData, globalUsername: username });
  };

  const handleAutoSyncSocialLinks = async () => {
    if (!businessCard || !formData.globalUsername) return;

    try {
      // Generate auto-synced links
      const autoSyncedLinks = generateAutoSyncedLinks(formData.globalUsername);
      
      // Remove existing auto-synced links
      await supabase
        .from('social_links')
        .delete()
        .eq('card_id', businessCard.id)
        .eq('is_auto_synced', true);

      // Insert new auto-synced links
      const { data, error } = await supabase
        .from('social_links')
        .insert(
          autoSyncedLinks.map((link, index) => ({
            card_id: businessCard.id,
            platform: link.platform,
            username: link.username,
            url: link.url,
            display_order: socialLinks.length + index,
            is_active: true,
            is_auto_synced: true,
          }))
        )
        .select();

      if (error) {
        console.error('Error auto-syncing social links:', error);
        alert('Failed to auto-sync social links. Please try again.');
        return;
      }

      // Update local state
      const newLinks = [...socialLinks, ...(data || [])];
      setSocialLinks(newLinks);
      
      alert('Social links auto-synced successfully!');
    } catch (error) {
      console.error('Error auto-syncing social links:', error);
      alert('Failed to auto-sync social links. Please try again.');
    }
  };

  const handleAddSocialLink = async () => {
    if (!businessCard || !newSocialLink.platform || !newSocialLink.username) return;

    try {
      const url = generateSocialLink(newSocialLink.platform, newSocialLink.username);
      const { data, error } = await supabase
        .from('social_links')
        .insert({
          card_id: businessCard.id,
          platform: newSocialLink.platform,
          username: newSocialLink.username,
          url,
          display_order: socialLinks.length,
          is_active: true,
          is_auto_synced: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding social link:', error);
        return;
      }

      setSocialLinks([...socialLinks, data]);
      setNewSocialLink({ platform: '', username: '' });
    } catch (error) {
      console.error('Error adding social link:', error);
    }
  };

  const handleSocialLinkEdit = async (linkId: string, newUsername: string) => {
    try {
      const link = socialLinks.find(l => l.id === linkId);
      if (!link) return;

      const newUrl = generateSocialLink(link.platform, newUsername);
      
      const { error } = await supabase
        .from('social_links')
        .update({ 
          username: newUsername, 
          url: newUrl,
          is_auto_synced: false
        })
        .eq('id', linkId);

      if (error) {
        console.error('Error updating social link:', error);
        return;
      }

      const updatedLinks = socialLinks.map(l =>
        l.id === linkId 
          ? { ...l, username: newUsername, url: newUrl, is_auto_synced: false }
          : l
      );
      setSocialLinks(updatedLinks);
    } catch (error) {
      console.error('Error updating social link:', error);
    }
  };

  const handleRemoveSocialLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('social_links')
        .delete()
        .eq('id', linkId);

      if (error) {
        console.error('Error removing social link:', error);
        return;
      }

      setSocialLinks(socialLinks.filter(link => link.id !== linkId));
    } catch (error) {
      console.error('Error removing social link:', error);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Type },
    { id: 'contact', label: 'Contact', icon: Globe },
    { id: 'social', label: 'Social Links', icon: Share2 },
    { id: 'media', label: 'Media', icon: Layout },
    { id: 'reviews', label: 'Reviews', icon: Eye },
    { id: 'design', label: 'Design', icon: Palette },
  ];

  return (
    <div className="max-w-7xl mx-auto">
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
                      onClick={() => setActiveTab(tab.id as any)}
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
                        const savedCard = await handleSave();
                        if (savedCard) {
                          setBusinessCard(savedCard);
                          setActiveTab("contact");
                        }
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
                        setTimeout(() => {
                          onSave();
                        }, 4000);
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
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
  );
};