import ShelfListScreen from '../components/ShelfListScreen';

export default function ChildrensScreen() {
  return (
    <ShelfListScreen
      title="Children's Books"
      subtitle="Spark a love of reading from an early age"
      headerColor="#1B4332"
      icon="happy-outline"
      fetchParams={{ shelf: 'childrensBooks', limit: 20 }}
      categoryName="Children's Books"
    />
  );
}
