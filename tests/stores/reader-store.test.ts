import { describe, it, expect, beforeEach } from 'vitest';
import { useReaderStore } from '@/lib/stores/reader-store';

describe('ReaderStore', () => {
  beforeEach(() => {
    const store = useReaderStore.getState();
    store.navigateToPage(1);
    useReaderStore.setState({ navigationHistory: [] });
  });

  it('should initialize with default values', () => {
    const state = useReaderStore.getState();
    expect(state.currentPage).toBe(1);
    expect(state.currentSurah).toBeNull();
    expect(state.navigationHistory).toEqual([]);
  });

  it('should navigate to a valid page', () => {
    const { navigateToPage } = useReaderStore.getState();
    navigateToPage(293);
    
    const state = useReaderStore.getState();
    expect(state.currentPage).toBe(293);
    expect(state.navigationHistory).toContain(1);
  });

  it('should not navigate to invalid pages', () => {
    const { navigateToPage } = useReaderStore.getState();
    navigateToPage(605);
    
    const state = useReaderStore.getState();
    expect(state.currentPage).toBe(1);
  });

  it('should navigate to surah with starting page', () => {
    const { navigateToSurah } = useReaderStore.getState();
    navigateToSurah(18, 293);
    
    const state = useReaderStore.getState();
    expect(state.currentPage).toBe(293);
    expect(state.currentSurah).toBe(18);
  });

  it('should go to next page', () => {
    const { nextPage } = useReaderStore.getState();
    nextPage();
    
    const state = useReaderStore.getState();
    expect(state.currentPage).toBe(2);
  });

  it('should go to previous page', () => {
    const { navigateToPage, previousPage } = useReaderStore.getState();
    navigateToPage(10);
    previousPage();
    
    const state = useReaderStore.getState();
    expect(state.currentPage).toBe(9);
  });

  it('should not go below page 1', () => {
    const { previousPage } = useReaderStore.getState();
    previousPage();
    
    const state = useReaderStore.getState();
    expect(state.currentPage).toBe(1);
  });

  it('should not go above page 604', () => {
    const { navigateToPage, nextPage } = useReaderStore.getState();
    navigateToPage(604);
    nextPage();
    
    const state = useReaderStore.getState();
    expect(state.currentPage).toBe(604);
  });

  it('should track navigation history and go back', () => {
    const { navigateToPage, goBack } = useReaderStore.getState();
    
    navigateToPage(10);
    navigateToPage(20);
    navigateToPage(30);
    
    goBack();
    let state = useReaderStore.getState();
    expect(state.currentPage).toBe(20);
    
    goBack();
    state = useReaderStore.getState();
    expect(state.currentPage).toBe(10);
  });
});
