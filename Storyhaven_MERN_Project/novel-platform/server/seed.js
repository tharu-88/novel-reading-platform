import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const target = 20;
const demoPassword = 'DemoPass123!';

function sampleChapters(title, genre) {
  return [
    {
      _id: new mongoose.Types.ObjectId(),
      title: 'The First Sign',
      content: [
        `The morning the story began, ${title} was still only a name on a page. Beyond the window, the town moved through its familiar routine, unaware that the day had already begun to change.`,
        `A quiet detail refused to fit: a light in an empty room, a message with no sender, or a footprint where no one had walked. It was small enough to ignore, but impossible to forget.`,
        `By noon, the first clue had found its way into the hands of someone who knew better than to trust coincidence. The old map was opened, and a route no one had used in years came back into view.`,
        `When evening settled in, the decision was made. Whatever waited at the end of that road, the only way forward was to follow the sign and discover why it had appeared now.`
      ].join('\n\n')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      title: 'Beyond the Map',
      content: [
        `The road beyond the last familiar street was quieter than expected. ${genre} had always seemed like a word for other people's stories; tonight, it felt like a description of the world just ahead.`,
        `At the first turn, a weathered marker carried the same symbol as the clue. Its edges were worn smooth, but a fresh line had been carved beneath it, pointing toward the hills.`,
        `The journey slowed when the path divided. One trail offered shelter and an easy return; the other disappeared into the dark. A second look at the map revealed a note written in a hand that seemed strangely familiar.`,
        `They chose the narrow trail. Behind them, the lights of home faded, while somewhere ahead a door opened with a soft click. The next answer was waiting, and so was the question it would bring.`
      ].join('\n\n')
    }
  ];
}

function paragraphCount(content) {
  return String(content || '').split(/\r?\n\s*\r?\n/).filter(paragraph => paragraph.trim()).length;
}

await mongoose.connect(process.env.MONGO_URI);

try {
  const database = mongoose.connection.db;
  const users = database.collection('users');
  const books = database.collection('books');
  const comments = database.collection('comments');
  const now = new Date();
  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const userCount = await users.countDocuments();

  for (let index = userCount; index < target; index += 1) {
    const suffix = randomBytes(4).toString('hex');
    await users.insertOne({
      username: `demo_${suffix}`,
      email: `demo-${suffix}@example.test`,
      passwordHash,
      bio: 'A Storyhaven demo reader and writer.',
      photo: '',
      library: [],
      progress: [],
      createdAt: now,
      updatedAt: now
    });
  }

  const userIds = (await users.find({}, { projection: { _id: 1 } }).toArray()).map(user => user._id);
  const bookCount = await books.countDocuments();
  const genres = ['Sci-Fi', 'Romance', 'Mystery', 'Thriller', 'Fantasy', 'Other'];

  for (let index = bookCount; index < target; index += 1) {
    const suffix = randomBytes(4).toString('hex');
    const chapterId = new mongoose.Types.ObjectId();
    await books.insertOne({
      title: `Demo Story ${index + 1} ${suffix}`,
      description: 'A sample story created for local development.',
      genre: genres[index % genres.length],
      cover: '',
      author: userIds[index % userIds.length],
      status: 'published',
      chapters: sampleChapters(`Demo Story ${index + 1} ${suffix}`, genres[index % genres.length]),
      votes: [],
      createdAt: now,
      updatedAt: now
    });
  }

  const demoBooks = await books.find({ title: /^Demo Story / }).toArray();
  for (const book of demoBooks) {
    const samples = sampleChapters(book.title, book.genre);
    const chapters = book.chapters || [];

    for (let index = 0; index < chapters.length; index += 1) {
      if (paragraphCount(chapters[index].content) < 4) {
        const sample = samples[index] || samples[1];
        chapters[index].title = sample.title;
        chapters[index].content = sample.content;
      }
    }

    while (chapters.length < 2) chapters.push(samples[chapters.length]);
    await books.updateOne({ _id: book._id }, { $set: { chapters, updatedAt: new Date() } });
  }

  const publishedBooks = await books.find(
    { status: 'published', 'chapters.0': { $exists: true } },
    { projection: { _id: 1, chapters: 1 } }
  ).toArray();
  const commentCount = await comments.countDocuments();

  for (let index = commentCount; index < target && publishedBooks.length > 0; index += 1) {
    const book = publishedBooks[index % publishedBooks.length];
    await comments.insertOne({
      book: book._id,
      chapter: book.chapters[0]._id,
      author: userIds[index % userIds.length],
      text: `Demo comment ${index + 1}: I enjoyed this chapter.`,
      createdAt: now,
      updatedAt: now
    });
  }

  console.log(JSON.stringify({
    counts: {
      users: await users.countDocuments(),
      books: await books.countDocuments(),
      comments: await comments.countDocuments()
    },
    demoPassword
  }, null, 2));
} finally {
  await mongoose.disconnect();
}
