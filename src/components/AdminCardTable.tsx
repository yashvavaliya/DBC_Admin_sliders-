import React, { useState } from 'react';
import { 
  CreditCard, 
  Eye, 
  Trash2, 
  Search, 
  Download, 
  ToggleLeft,
  ToggleRight,
  Calendar,
  User,
  Building,
  BarChart3
} from 'lucide-react';

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

interface AdminCardTableProps {
  cards: BusinessCard[];
  onToggleCardStatus: (cardId: string, currentStatus: boolean) => Promise<{ success: boolean; error?: string }>;
  onDeleteCard: (cardId: string) => Promise<{ success: boolean; error?: string }>;
  onExportCSV: (data: any[], filename: string) => void;
}

export const AdminCardTable: React.FC<AdminCardTableProps> = ({
  cards,
  onToggleCardStatus,
  onDeleteCard,
  onExportCSV
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof BusinessCard>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const filteredCards = cards
    .filter(card => {
      const matchesSearch = 
        card.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'published' && card.is_published) ||
        (statusFilter === 'draft' && !card.is_published);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: keyof BusinessCard) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectCard = (cardId: string) => {
    setSelectedCards(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCards.length === filteredCards.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(filteredCards.map(card => card.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCards.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedCards.length} cards? This action cannot be undone.`)) {
      return;
    }

    for (const cardId of selectedCards) {
      await onDeleteCard(cardId);
    }
    setSelectedCards([]);
  };

  const handleBulkToggleStatus = async () => {
    if (selectedCards.length === 0) return;

    for (const cardId of selectedCards) {
      const card = cards.find(c => c.id === cardId);
      if (card) {
        await onToggleCardStatus(cardId, card.is_published);
      }
    }
    setSelectedCards([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Cards Management</h2>
          <p className="text-gray-600">Manage all business cards and their publication status</p>
        </div>
        
        <div className="flex gap-3">
          {selectedCards.length > 0 && (
            <>
              <button
                onClick={handleBulkToggleStatus}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <ToggleRight className="w-4 h-4" />
                Toggle Status ({selectedCards.length})
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedCards.length})
              </button>
            </>
          )}
          <button
            onClick={() => onExportCSV(cards, 'cards-export.csv')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search cards by title, company, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Cards Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCards.length === filteredCards.length && filteredCards.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('title')}
                >
                  Card
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('profiles')}
                >
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('view_count')}
                >
                  Views
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('updated_at')}
                >
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCards.map((card) => (
                <tr key={card.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedCards.includes(card.id)}
                      onChange={() => handleSelectCard(card.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {card.title || 'Untitled Card'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {card.company || 'No company'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {card.profiles?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {card.profiles?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      card.is_published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {card.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{card.view_count || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {formatDate(card.updated_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => window.open(`/c/${card.slug}`, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Card"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleCardStatus(card.id, card.is_published)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title={card.is_published ? 'Unpublish' : 'Publish'}
                      >
                        {card.is_published ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => onDeleteCard(card.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Cards Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No business cards have been created yet'}
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-green-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">
              Showing {filteredCards.length} of {cards.length} cards
            </span>
          </div>
          {selectedCards.length > 0 && (
            <span className="text-sm text-green-700">
              {selectedCards.length} selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
};