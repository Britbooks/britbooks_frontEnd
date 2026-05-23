import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../constants/Colors';
import { Book } from '../types';
import BookCard from './BookCard';
import SkeletonCard from './SkeletonCard';

interface Props {
  title: string;
  books: Book[];
  loading?: boolean;
  seeAllRoute?: string;
  cardWidth?: number;
}

export default function BookShelf({ title, books, loading = false, seeAllRoute, cardWidth = 148 }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {seeAllRoute && (
          <TouchableOpacity style={styles.seeAll} onPress={() => router.push(seeAllRoute as any)}>
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.accent} />
          </TouchableOpacity>
        )}
      </View>
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ width: Spacing.sm }} />}
          renderItem={() => <SkeletonCard width={cardWidth} />}
        />
      ) : (
        <FlatList
          data={books}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(b) => b._id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ width: Spacing.sm }} />}
          renderItem={({ item }) => <BookCard book={item} width={cardWidth} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title3,
    color: Colors.text,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
  },
  list: {
    paddingHorizontal: Spacing.base,
  },
});
