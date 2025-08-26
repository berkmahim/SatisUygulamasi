import { useState, useCallback } from 'react';
import { DEFAULT_TEXT } from '../types/blockTypes';

export const useTextManagement = (initialTexts = [], onSave, onUpdate, onDelete) => {
  const [texts, setTexts] = useState(initialTexts);
  const [selectedText, setSelectedText] = useState(null);

  const addText = useCallback((position, text = 'New Text') => {
    const newText = {
      ...DEFAULT_TEXT,
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position,
      text
    };

    setTexts(prev => [...prev, newText]);
    
    if (onSave) {
      onSave(newText);
    }

    return newText;
  }, [onSave]);

  const updateText = useCallback((textId, updates) => {
    setTexts(prev => prev.map(text => 
      text.id === textId 
        ? { ...text, ...updates }
        : text
    ));

    if (onUpdate) {
      onUpdate(textId, updates);
    }
  }, [onUpdate]);

  const deleteText = useCallback((textId) => {
    setTexts(prev => prev.filter(text => text.id !== textId));
    
    if (selectedText === textId) {
      setSelectedText(null);
    }

    if (onDelete) {
      onDelete(textId);
    }
  }, [selectedText, onDelete]);

  const selectText = useCallback((textId) => {
    setSelectedText(textId === selectedText ? null : textId);
  }, [selectedText]);

  const getSelectedText = useCallback(() => {
    return texts.find(text => text.id === selectedText);
  }, [texts, selectedText]);

  const updateTextPosition = useCallback((textId, position) => {
    updateText(textId, { position });
  }, [updateText]);

  const updateTextContent = useCallback((textId, text) => {
    updateText(textId, { text });
  }, [updateText]);

  const updateTextStyle = useCallback((textId, style) => {
    updateText(textId, style);
  }, [updateText]);

  const clearSelection = useCallback(() => {
    setSelectedText(null);
  }, []);

  return {
    texts,
    setTexts,
    selectedText,
    addText,
    updateText,
    deleteText,
    selectText,
    getSelectedText,
    updateTextPosition,
    updateTextContent,
    updateTextStyle,
    clearSelection
  };
};