import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import { faker } from '@faker-js/faker';

// Number of products
const TOTAL_PRODUCTS = 1_000_000;

// CSV file path
const FILE_PATH = './million_products.csv';

// CSV writer setup
const csvWriter = createObjectCsvWriter({
  path: FILE_PATH,
  header: [
    { id: 'sku', title: 'SKU' },
    { id: 'isbn', title: 'ISBN' },
    { id: 'title', title: 'Title' },
    { id: 'author', title: 'Author' },
    { id: 'edition', title: 'Edition' },
    { id: 'language', title: 'Language' },
    { id: 'condition', title: 'Condition' },
    { id: 'price', title: 'Price' },
    { id: 'stock', title: 'Quantity' },
    { id: 'coverImageUrl', title: 'ImageUrl' },
    { id: 'notes', title: 'ItemDescription' },
    { id: 'format', title: 'Format' },
    { id: 'publisher', title: 'Publisher' },
    { id: 'publicationDate', title: 'PublicationDate' },
    { id: 'pages', title: 'Pages' },
    { id: 'dimsHeight', title: 'DimsHeight' },
    { id: 'dimsWidth', title: 'DimsWidth' },
    { id: 'dimsLength', title: 'DimsLength' },
    { id: 'dimsWeight', title: 'DimsWeight' },
    { id: 'category', title: 'Category' },
    { id: 'subcategory', title: 'Subcategory' },
    { id: 'tags', title: 'Tags' },
  ],
});

const conditions = ['new', 'like new', 'very good', 'good', 'acceptable'];
const languages = ['English', 'French', 'Spanish', 'German', 'Italian'];
const formats = ['Hardcover', 'Paperback', 'Digital'];

async function generateProducts() {
  const batchSize = 10_000; // write in chunks
  let batch = [];

  for (let i = 1; i <= TOTAL_PRODUCTS; i++) {
    const product = {
      sku: `SKU${i.toString().padStart(7, '0')}`,
      isbn: faker.string.numeric(13),
      title: faker.commerce.productName(),
      author: `${faker.person.firstName()} ${faker.person.lastName()}`,
      edition: `${faker.number.int({ min: 1, max: 10 })}th`,
      language: faker.helpers.arrayElement(languages),
      condition: faker.helpers.arrayElement(conditions),
      price: parseFloat(faker.commerce.price({ min: 5, max: 500 })),
      stock: faker.number.int({ min: 1, max: 100 }),
      coverImageUrl: faker.image.url(),
      notes: faker.lorem.sentence(),
      format: faker.helpers.arrayElement(formats),
      publisher: faker.company.name(),
      publicationDate: faker.date.past({ years: 20 }).toISOString().split('T')[0],
      pages: faker.number.int({ min: 50, max: 1500 }),
      dimsHeight: `${faker.number.int({ min: 15, max: 30 })} cm`,
      dimsWidth: `${faker.number.int({ min: 10, max: 25 })} cm`,
      dimsLength: `${faker.number.int({ min: 2, max: 10 })} cm`,
      dimsWeight: `${faker.number.int({ min: 200, max: 1500 })} g`,
      category: faker.commerce.department(),
      subcategory: faker.commerce.productAdjective(),
      tags: faker.helpers.arrayElements(['bestseller','classic','new','popular','rare'], 3).join(','),
    };

    batch.push(product);

    if (i % batchSize === 0 || i === TOTAL_PRODUCTS) {
      await csvWriter.writeRecords(batch);
      console.log(`Written ${i} / ${TOTAL_PRODUCTS} products`);
      batch = [];
    }
  }
}

generateProducts()
  .then(() => console.log('CSV generation complete!'))
  .catch((err) => console.error(err));
