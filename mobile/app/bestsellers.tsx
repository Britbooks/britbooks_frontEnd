import ShelfListScreen from '../components/ShelfListScreen';

export default function BestsellersScreen() {
  return (
    <ShelfListScreen
      title="Best Sellers"
      subtitle="The books everyone is talking about right now"
      headerColor="#7C2D12"
      icon="trophy-outline"
      fetchParams={{ shelf: 'bestSellers', limit: 20 }}
    />
  );
}
