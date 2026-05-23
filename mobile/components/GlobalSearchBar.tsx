import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, Typography } from '../constants/Colors';
import { useCart } from '../context/CartContext';
import { apiClient } from '../services/api';
import { ENDPOINTS } from '../constants/Api';

interface SearchResult {
  id: string;
  title: string;
  author: string;
  price: number;
  rating: number;
  imageUrl: string;
}

export default function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const { addToCart, isInCart } = useCart();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await apiClient.get(ENDPOINTS.market.search, {
          params: { keyword: query.trim() },
        });
        const raw = res.data?.results ?? res.data ?? [];
        const mapped: SearchResult[] = (Array.isArray(raw) ? raw : []).map((b: any) => ({
          id: String(b._id || b.bookId || b.id || ''),
          title: b.title || 'Untitled',
          author: b.author || 'Unknown Author',
          price: Number(b.price) || 0,
          rating: Number(b.rating) || 0,
          imageUrl: (b.coverImageUrl || b.imageUrl || '').replace(/^http:\/\//, 'https://'),
        }));
        setResults(mapped);
        setOpen(true);
      } catch {
        setError(true);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function handleSelect(id: string) {
    inputRef.current?.blur();
    setQuery('');
    setOpen(false);
    router.push(`/book/${id}` as any);
  }

  function handleClear() {
    setQuery('');
    setOpen(false);
    setResults([]);
    inputRef.current?.focus();
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputRow}>
        <Ionicons name="search-outline" size={17} color="rgba(255,255,255,0.55)" />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search books, authors, genres…"
          placeholderTextColor="rgba(255,255,255,0.4)"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={() => {
            if (query.trim()) {
              inputRef.current?.blur();
              setOpen(false);
              router.push('/(tabs)/explore' as any);
            }
          }}
        />
        {loading ? (
          <ActivityIndicator size="small" color={Colors.accent} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        ) : null}
      </View>

      {open && (
        <View style={styles.dropdown}>
          {error ? (
            <Text style={styles.stateText}>Search failed. Please try again.</Text>
          ) : results.length === 0 ? (
            <Text style={styles.stateText}>No results for "{query}"</Text>
          ) : (
            <FlatList
              data={results.slice(0, 8)}
              keyExtractor={(r) => r.id}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[styles.resultRow, index > 0 && styles.resultBorder]}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.75}
                >
                  <Image
                    source={{ uri: item.imageUrl || `https://picsum.photos/seed/${item.id}/60/80` }}
                    style={styles.cover}
                  />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.resultAuthor} numberOfLines={1}>{item.author}</Text>
                    {item.rating > 0 && (
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Ionicons
                            key={s}
                            name={s <= Math.round(item.rating) ? 'star' : 'star-outline'}
                            size={10}
                            color="#F59E0B"
                          />
                        ))}
                      </View>
                    )}
                    <Text style={styles.resultPrice}>£{item.price.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.addBtn, isInCart(item.id) && styles.addBtnAdded]}
                    onPress={() => {
                      if (!isInCart(item.id)) {
                        addToCart({
                          id: item.id,
                          title: item.title,
                          author: item.author,
                          price: item.price,
                          img: item.imageUrl,
                          stock: 99,
                        });
                      }
                    }}
                    hitSlop={6}
                  >
                    <Ionicons
                      name={isInCart(item.id) ? 'checkmark' : 'bag-add-outline'}
                      size={15}
                      color={Colors.white}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 99,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.white,
    padding: 0,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    maxHeight: 340,
    overflow: 'hidden',
  },
  stateText: {
    ...Typography.callout,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  resultBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  cover: {
    width: 40,
    height: 56,
    borderRadius: Radius.sm,
    backgroundColor: Colors.skeleton,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  resultAuthor: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
    marginTop: 1,
  },
  resultPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
    marginTop: 2,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnAdded: {
    backgroundColor: Colors.success,
  },
});
