import ShelfListScreen from '../components/ShelfListScreen';

export default function NonFictionScreen() {
  return (
    <ShelfListScreen
      title="Non-Fiction"
      subtitle="Knowledge, insight & true stories"
      headerColor="#2D1B4E"
      icon="newspaper-outline"
      fetchParams={{ category: 'Non-Fiction', limit: 20 }}
      categoryName="Non-Fiction"
    />
  );
}
