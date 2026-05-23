import ShelfListScreen from '../components/ShelfListScreen';

export default function FictionScreen() {
  return (
    <ShelfListScreen
      title="Fiction"
      subtitle="Stories that transport you to another world"
      headerColor="#1A2F5E"
      icon="book-outline"
      fetchParams={{ category: 'Fiction', limit: 20 }}
      categoryName="Fiction"
    />
  );
}
