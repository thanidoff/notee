import { describe, it, expect, beforeEach } from 'vitest';
import { useVaultStore } from '../store';
import { KnowledgeCard } from '../types';

describe('Vault Store (Zustand)', () => {
  beforeEach(() => {
    // Clear state before each test
    useVaultStore.getState().clearVault();
  });

  const mockCard: KnowledgeCard = {
    id: '123',
    title: 'Test Prompt',
    type: 'prompt',
    raw_content: 'This is a test prompt',
    summary: 'Test summary',
    use_this_when: ['testing'],
    status: 'saved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    use_count: 0,
  };

  it('should add a card to the vault', () => {
    useVaultStore.getState().addCard(mockCard);
    const cards = useVaultStore.getState().cards;
    
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('123');
    expect(cards[0].title).toBe('Test Prompt');
  });

  it('should update an existing card', () => {
    useVaultStore.getState().addCard(mockCard);
    
    // Update the card
    useVaultStore.getState().updateCard('123', { title: 'Updated Title', use_count: 1 });
    
    const cards = useVaultStore.getState().cards;
    expect(cards[0].title).toBe('Updated Title');
    expect(cards[0].use_count).toBe(1);
    expect(cards[0].updated_at).not.toBe(mockCard.updated_at); // updated_at should change
  });

  it('should remove a card from the vault', () => {
    useVaultStore.getState().addCard(mockCard);
    expect(useVaultStore.getState().cards).toHaveLength(1);
    
    useVaultStore.getState().removeCard('123');
    expect(useVaultStore.getState().cards).toHaveLength(0);
  });

  it('should clear all cards', () => {
    useVaultStore.getState().addCard(mockCard);
    useVaultStore.getState().clearVault();
    expect(useVaultStore.getState().cards).toHaveLength(0);
  });
});
