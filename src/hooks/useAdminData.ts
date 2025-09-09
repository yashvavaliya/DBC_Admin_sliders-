import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
  last_login: string | null;
  avatar_url: string | null;
  role: string;
}

interface BusinessCard {
  id: string;
  title: string | null;
  company: string | null;
  is_published: boolean;
  updated_at: string;
  user_id: string;
  slug: string | null;
  view_count: number;
  profiles: {
    name: string | null;
    email: string | null;
  };
}

interface Analytics {
  totalUsers: number;
  totalCards: number;
  activeUsers: number;
  publishedCards: number;
  totalViews: number;
  newUsersThisMonth: number;
  userGrowthData: Array<{ month: string; users: number }>;
}

export const useAdminData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalUsers: 0,
    totalCards: 0,
    activeUsers: 0,
    publishedCards: 0,
    totalViews: 0,
    newUsersThisMonth: 0,
    userGrowthData: []
  });
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCards = async () => {
    try {
      // Fetch cards
      const { data: cardsData, error: cardsError } = await supabase
        .from('business_cards')
        .select('*')
        .order('updated_at', { ascending: false });

      if (cardsError) throw cardsError;

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email');

      if (profilesError) throw profilesError;

      // Merge profile info into cards
      const cardsWithProfiles = (cardsData || []).map(card => ({
        ...card,
        profiles: profilesData?.find(profile => profile.id === card.user_id) || { name: null, email: null }
      }));

      setCards(cardsWithProfiles);
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total cards
      const { count: totalCards } = await supabase
        .from('business_cards')
        .select('*', { count: 'exact', head: true });

      // Get published cards
      const { count: publishedCards } = await supabase
        .from('business_cards')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      // Get total views
      const { data: viewsData } = await supabase
        .from('business_cards')
        .select('view_count');

      const totalViews = viewsData?.reduce((sum, card) => sum + (card.view_count || 0), 0) || 0;

      // Get new users this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newUsersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Get user growth data for last 6 months
      const userGrowthData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        userGrowthData.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          users: count || 0
        });
      }

      setAnalytics({
        totalUsers: totalUsers || 0,
        totalCards: totalCards || 0,
        activeUsers: totalUsers || 0, // Simplified - could be enhanced with session tracking
        publishedCards: publishedCards || 0,
        totalViews,
        newUsersThisMonth: newUsersThisMonth || 0,
        userGrowthData
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.filter(user => user.id !== userId));
      await loadAnalytics(); // Refresh analytics
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: 'Failed to delete user' };
    }
  };

  const toggleCardStatus = async (cardId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('business_cards')
        .update({ is_published: !currentStatus })
        .eq('id', cardId);

      if (error) throw error;

      setCards(cards.map(card => 
        card.id === cardId 
          ? { ...card, is_published: !currentStatus }
          : card
      ));
      await loadAnalytics(); // Refresh analytics
      return { success: true };
    } catch (error) {
      console.error('Error updating card status:', error);
      return { success: false, error: 'Failed to update card status' };
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('business_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      setCards(cards.filter(card => card.id !== cardId));
      await loadAnalytics(); // Refresh analytics
      return { success: true };
    } catch (error) {
      console.error('Error deleting card:', error);
      return { success: false, error: 'Failed to delete card' };
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadUsers(),
          loadCards(),
          loadAnalytics()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    users,
    cards,
    analytics,
    loading,
    deleteUser,
    toggleCardStatus,
    deleteCard,
    exportToCSV,
    refreshData: () => Promise.all([loadUsers(), loadCards(), loadAnalytics()])
  };
};