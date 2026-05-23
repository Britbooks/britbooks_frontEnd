import ShelfListScreen from '../components/ShelfListScreen';

export default function PopularScreen() {
  return (
    <ShelfListScreen
      title="Reader Picks"
      subtitle="Loved and recommended by thousands of readers"
      headerColor="#312E81"
      icon="heart-outline"
      fetchParams={{ shelf: 'popularBooks', limit: 20 }}
    />
  );
}
