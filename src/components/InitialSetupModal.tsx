'use client';

import React, { useState, useEffect } from 'react';
import { AppSettings, ALL_BASE_FIELDS } from '../lib/types';
import { Settings, Check, Radio, Circle, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

interface InitialSetupModalProps {
  isOpen: boolean;
  currentSettings: AppSettings | null;
  onSave: (settings: {
    is_initialized: boolean;
    custom_field_1_name: string | null;
    custom_field_2_name: string | null;
    custom_field_3_name: string | null;
    key_fields: string[];
  }) => void;
  onResetData?: () => Promise<void>;
  onClose?: () => void;
}

export const InitialSetupModal: React.FC<InitialSetupModalProps> = ({
  isOpen,
  currentSettings,
  onSave,
  onResetData,
  onClose,
}) => {
  const [custom1, setCustom1] = useState('');
  const [custom2, setCustom2] = useState('');
  const [custom3, setCustom3] = useState('');
  const [selectedKeyField, setSelectedKeyField] = useState<string>('genre');

  const isLoadedRef = React.useRef(false);

  // Sync settings when modal opens so values are initialized once when opened
  useEffect(() => {
    if (!isOpen) {
      isLoadedRef.current = false;
      return;
    }

    if (isOpen && currentSettings && !isLoadedRef.current) {
      isLoadedRef.current = true;
      setCustom1(currentSettings.custom_field_1_name || '');
      setCustom2(currentSettings.custom_field_2_name || '');
      setCustom3(currentSettings.custom_field_3_name || '');

      if (currentSettings.key_fields && currentSettings.key_fields.length > 0) {
        setSelectedKeyField(currentSettings.key_fields[0]);
      } else {
        setSelectedKeyField('genre');
      }
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  // Available selectable fields for the single key field
  const customItems = [
    { id: 'custom_field_1', label: custom1.trim() || 'ユーザー定義項目1' },
    { id: 'custom_field_2', label: custom2.trim() || 'ユーザー定義項目2' },
    { id: 'custom_field_3', label: custom3.trim() || 'ユーザー定義項目3' },
  ].filter((_, index) => {
    if (index === 0) return Boolean(custom1.trim());
    if (index === 1) return Boolean(custom2.trim());
    if (index === 2) return Boolean(custom3.trim());
    return false;
  });

  const availableKeyFields = [
    ...ALL_BASE_FIELDS.map((f) => ({ id: f.id, label: f.label })),
    ...customItems,
  ];

  const handleSave = () => {
    onSave({
      is_initialized: true,
      custom_field_1_name: custom1.trim() || null,
      custom_field_2_name: custom2.trim() || null,
      custom_field_3_name: custom3.trim() || null,
      key_fields: [selectedKeyField], // Always single selection
    });
    if (onClose) onClose();
  };

  const handleResetData = async () => {
    if (confirm('設定とすべての登録済み動画データを初期化しますか？この操作は取り消せません。')) {
      if (onResetData) {
        await onResetData();
      }
      setCustom1('');
      setCustom2('');
      setCustom3('');
      setSelectedKeyField('genre');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card w-full max-w-2xl rounded-2xl border border-slate-700/60 shadow-2xl p-6 md:p-8 space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-700/60 pb-4">
          <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">設定</h2>
          </div>
        </div>

        {/* Section 1: User defined fields */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            1. ユーザー定義項目（最大3つまで）
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">項目 1</label>
              <input
                type="text"
                value={custom1}
                onChange={(e) => setCustom1(e.target.value)}
                placeholder="例: 監督"
                className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">項目 2</label>
              <input
                type="text"
                value={custom2}
                onChange={(e) => setCustom2(e.target.value)}
                placeholder="例: シリーズ"
                className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">項目 3</label>
              <input
                type="text"
                value={custom3}
                onChange={(e) => setCustom3(e.target.value)}
                placeholder="例: タグ"
                className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Key item selection (Single selection only) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            2. キー項目の選択（1つのみ）
          </h3>
          <p className="text-xs text-slate-400">
            メインインデックスで使用する項目を1つ選択してください。
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableKeyFields.map((field) => {
              const isSelected = selectedKeyField === field.id;
              return (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => setSelectedKeyField(field.id)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left',
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  )}
                >
                  {isSelected ? (
                    <Radio className="w-5 h-5 text-blue-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600 shrink-0" />
                  )}
                  <span>{field.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-500/40 bg-red-600/10 text-red-400 hover:bg-red-600/20 font-medium text-sm transition-colors"
            title="設定と登録済みデータをすべて初期化"
          >
            <RotateCcw className="w-4 h-4" />
            <span>データ初期化</span>
          </button>

          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                キャンセル
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-blue-500/25 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>設定を保存する</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
