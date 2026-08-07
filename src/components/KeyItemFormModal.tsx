'use client';

import React, { useState, useEffect } from 'react';
import { KeyItemGroup } from '@/lib/types';
import { X, Save, Tag, User } from 'lucide-react';

interface KeyItemFormModalProps {
  isOpen: boolean;
  group: KeyItemGroup | null;
  initialCastKana?: string;
  onSave: (data: { key_signature: string; cast_kana: string; tags: string }) => Promise<void>;
  onClose: () => void;
}

export const KeyItemFormModal: React.FC<KeyItemFormModalProps> = ({
  isOpen,
  group,
  initialCastKana = '',
  onSave,
  onClose,
}) => {
  const [castKana, setCastKana] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const loadedGroupKeyRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !group) {
      loadedGroupKeyRef.current = null;
      return;
    }

    if (loadedGroupKeyRef.current !== group.key_signature) {
      loadedGroupKeyRef.current = group.key_signature;
      setCastKana(initialCastKana || '');
      setTags(group.tags || '');
    }
  }, [isOpen, group]);

  if (!isOpen || !group) return null;

  const titleString = Object.values(group.key_values).join(' / ');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        key_signature: group.key_signature,
        cast_kana: castKana.trim(),
        tags: tags.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Failed to save key item details:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              キー項目編集
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">
              {titleString}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Key Value Display */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[10px]">
              対象キー項目
            </span>
            <div className="text-sm font-bold text-blue-400">
              {titleString}
            </div>
          </div>

          {/* Cast Kana Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-400" />
              <span>主演（ふりがな）</span>
            </label>
            <input
              type="text"
              value={castKana}
              onChange={(e) => setCastKana(e.target.value)}
              placeholder="例: やまだ たろう"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <p className="text-[11px] text-slate-500">
              ※このキー項目に紐づくすべての動画の「主演（ふりがな）」に反映されます。
            </p>
          </div>

          {/* Tags Field (Key Item Specific) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>タグ （キー項目専用）</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例: アクション, 主演作, オススメ"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <p className="text-[11px] text-slate-500">
              ※キー項目専用のタグ情報です。
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-600/30 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? '保存中...' : '保存'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
