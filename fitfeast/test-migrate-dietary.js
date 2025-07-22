// test-migrate-dietary.js
// Run this script with: node test-migrate-dietary.js
// Make sure MongoDB is running and the URI is correct.

const mongoose = require('mongoose');
const uri = 'mongodb://localhost:27017/fitfeast'; // Update if your DB is elsewhere

async function migrateDietaryToDietType() {
  await mongoose.connect(uri);
  const Recipe = mongoose.connection.collection('recipes');
  const cursor = Recipe.find({ dietary: { $exists: true } });

  let count = 0;
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const dietaryValue = doc.dietary;
    if (dietaryValue) {
      await Recipe.updateOne(
        { _id: doc._id },
        {
          $set: { dietType: [dietaryValue] },
          $unset: { dietary: "" }
        }
      );
      count++;
    }
  }
  console.log(`Migration complete! Updated ${count} recipes.`);
  await mongoose.disconnect();
}

migrateDietaryToDietType().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 