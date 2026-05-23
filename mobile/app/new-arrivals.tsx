import ShelfListScreen from '../components/ShelfListScreen';

export default function NewArrivalsScreen() {
  return (
    <ShelfListScreen
      title="New Arrivals"
      subtitle="Fresh titles landing on our shelves every week"
      headerColor="#0A1628"
      icon="sparkles-outline"
      fetchParams={{ shelf: 'newArrivals', limit: 20 }}
    />
  );
}
