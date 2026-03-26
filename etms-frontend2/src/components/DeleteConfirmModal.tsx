import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  entityName?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  entityName,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="absolute top-4 right-4 focus:outline-none">
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-red-50">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Are you sure?
          </h3>
          
          <p className="text-gray-500 text-sm mb-6 text-center">
            {title}. This will permanently delete the data for <span className="text-gray-900 font-semibold">{entityName || 'this item'}</span>.
          </p>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-medium"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-red-200"
            >
              {isDeleting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" /> Confirm Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
