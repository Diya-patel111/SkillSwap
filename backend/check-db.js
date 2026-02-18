require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Skill = require('./src/models/Skill');
  const total = await Skill.countDocuments();
  const approved = await Skill.countDocuments({ isApproved: true });
  const counts = await Skill.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  console.log('Total:', total, '| Approved:', approved);
  counts.forEach(c => console.log(' -', c._id + ':', c.count));
  const sample = await Skill.findOne({ isApproved: true }).lean();
  if (sample) console.log('\nSample skill:', JSON.stringify(sample, null, 2));
  mongoose.disconnect();
});
