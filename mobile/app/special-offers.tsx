import ShelfListScreen from '../components/ShelfListScreen';

export default function SpecialOffersScreen() {
  return (
    <ShelfListScreen
      title="Special Offers"
      subtitle="Handpicked deals — up to 50% off selected titles"
      headerColor="#7F1D1D"
      icon="pricetag-outline"
      fetchParams={{ shelf: 'clearanceItems', limit: 20 }}
    />
  );
}
