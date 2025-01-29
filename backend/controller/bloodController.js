import asyncHandler from '../middleware/asyncHandler.js';
import Blood from '../models/bloodModel.js';

const getBloods = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          {
            group: { $regex: req.query.keyword, $options: 'i' },
          },
        ],
      }
    : {};

  const bloods = await Blood.find({ ...keyword });

  res.json({ bloods });
});

const getBloodById = asyncHandler(async (req, res) => {
  const blood = await Blood.findById(req.params.id);

  if (blood) {
    return res.json(blood);
  }
  res.status(404);
  throw new Error('Bloods Not Found');
});

const createBlood = asyncHandler(async (req, res) => {
  const blood = new Blood({
    name: 'Sample name',
    user: req.user._id,
    image: '/images/sample.jpg',
    group: 'Sample degree',
    lastdonate: 'Sample Donate',
    age: 0,
    address: 'Sample chamber',
    contact: 'Sample available',
  });

  const createdBlood = await blood.save();
  res.status(201).json(createdBlood);
});

const updateBlood = asyncHandler(async (req, res) => {
  const { name, image, group, lastdonate, age, address, contact } = req.body;

  const blood = await Blood.findById(req.params.id);

  if (blood) {
    blood.name = name;
    blood.image = image;
    blood.group = group;
    blood.lastdonate = lastdonate;
    blood.age = age;
    blood.address = address;
    blood.contact = contact;

    const updatedBlood = await blood.save();
    res.json(updatedBlood);
  } else {
    res.status(404);
    throw new Error('Doctor not found');
  }
});

const deleteBlood = asyncHandler(async (req, res) => {
  const blood = await Blood.findById(req.params.id);

  if (blood) {
    await Blood.deleteOne({ _id: blood._id });
    res.json({ message: 'Donor removed' });
  } else {
    res.status(404);
    throw new Error('Donor not found');
  }
});

export { getBloods, getBloodById, createBlood, updateBlood, deleteBlood };
