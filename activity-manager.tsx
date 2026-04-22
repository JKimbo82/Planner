'use client';

import { useState } from 'react';
import { Activity, Category } from '@/lib/types';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_SOLID_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface ActivityManagerProps {
  activities: Activity[];
  onAdd: (activity: Omit<Activity, 'id'>) => Activity;
  onUpdate: (id: string, updates: Partial<Omit<Activity, 'id'>>) => void;
  onDelete: (id: string) => void;
}

export function ActivityManager({
  activities,
  onAdd,
  onUpdate,
  onDelete,
}: ActivityManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState({ name: '', category: 'physical' as Category, description: '' });
  const [editActivity, setEditActivity] = useState({ name: '', description: '' });

  const filteredActivities = selectedCategory === 'all'
    ? activities
    : activities.filter(a => a.category === selectedCategory);

  const groupedActivities = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = filteredActivities.filter(a => a.category === cat.id);
    return acc;
  }, {} as Record<Category, Activity[]>);

  const handleAdd = () => {
    if (!newActivity.name.trim()) return;
    onAdd({
      name: newActivity.name.trim(),
      category: newActivity.category,
      description: newActivity.description.trim() || undefined,
    });
    setNewActivity({ name: '', category: 'physical', description: '' });
    setIsAdding(false);
  };

  const handleStartEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setEditActivity({ name: activity.name, description: activity.description || '' });
  };

  const handleSaveEdit = (id: string) => {
    if (!editActivity.name.trim()) return;
    onUpdate(id, {
      name: editActivity.name.trim(),
      description: editActivity.description.trim() || undefined,
    });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Activity Manager</h2>
            <p className="text-sm text-muted-foreground">
              Create and manage your training activities
            </p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Activity
          </button>
        </div>

        {/* Add New Activity Form */}
        {isAdding && (
          <div className="mb-6 p-4 bg-surface-1 border border-border rounded-lg">
            <h3 className="text-sm font-semibold mb-3 text-foreground">New Activity</h3>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Activity name"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <select
                  value={newActivity.category}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, category: e.target.value as Category }))}
                  className="px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Description (optional)"
                value={newActivity.description}
                onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                className="px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewActivity({ name: '', category: 'physical', description: '' });
                  }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Add Activity
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-2 text-muted-foreground hover:text-foreground'
            )}
          >
            All ({activities.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = activities.filter(a => a.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                  selectedCategory === cat.id
                    ? CATEGORY_SOLID_COLORS[cat.id]
                    : 'bg-surface-2 text-muted-foreground hover:text-foreground'
                )}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Activities Grid */}
        <div className="space-y-6">
          {selectedCategory === 'all' ? (
            // Show grouped by category
            CATEGORIES.map(cat => {
              const catActivities = groupedActivities[cat.id];
              if (catActivities.length === 0) return null;

              return (
                <div key={cat.id}>
                  <h3 
                    className="text-sm font-semibold mb-3 uppercase tracking-wide"
                    style={{ color: cat.color }}
                  >
                    {cat.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catActivities.map(activity => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        isEditing={editingId === activity.id}
                        editValues={editActivity}
                        onEditChange={setEditActivity}
                        onStartEdit={() => handleStartEdit(activity)}
                        onSaveEdit={() => handleSaveEdit(activity.id)}
                        onCancelEdit={handleCancelEdit}
                        onDelete={() => onDelete(activity.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            // Show flat list for selected category
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredActivities.map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isEditing={editingId === activity.id}
                  editValues={editActivity}
                  onEditChange={setEditActivity}
                  onStartEdit={() => handleStartEdit(activity)}
                  onSaveEdit={() => handleSaveEdit(activity.id)}
                  onCancelEdit={handleCancelEdit}
                  onDelete={() => onDelete(activity.id)}
                />
              ))}
            </div>
          )}

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No activities found.</p>
              <button
                onClick={() => setIsAdding(true)}
                className="mt-4 text-primary hover:underline"
              >
                Add your first activity
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ActivityCardProps {
  activity: Activity;
  isEditing: boolean;
  editValues: { name: string; description: string };
  onEditChange: (values: { name: string; description: string }) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

function ActivityCard({
  activity,
  isEditing,
  editValues,
  onEditChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: ActivityCardProps) {
  if (isEditing) {
    return (
      <div className={cn(
        'p-4 rounded-lg border-l-4',
        CATEGORY_COLORS[activity.category]
      )}>
        <input
          type="text"
          value={editValues.name}
          onChange={(e) => onEditChange({ ...editValues, name: e.target.value })}
          className="w-full px-2 py-1 mb-2 bg-input border border-border rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          autoFocus
        />
        <input
          type="text"
          value={editValues.description}
          onChange={(e) => onEditChange({ ...editValues, description: e.target.value })}
          placeholder="Description (optional)"
          className="w-full px-2 py-1 mb-3 bg-input border border-border rounded text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancelEdit}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={onSaveEdit}
            className="p-1.5 text-primary hover:text-primary/80 transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'p-4 rounded-lg border-l-4 group',
      CATEGORY_COLORS[activity.category]
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{activity.name}</h4>
          {activity.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {activity.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button
            onClick={onStartEdit}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
