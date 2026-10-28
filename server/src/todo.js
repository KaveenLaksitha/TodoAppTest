import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  done: { type: Boolean, default: false },
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform(_doc, value) {
      value.id = value._id.toString();
      delete value._id;
      return value;
    },
  },
});

const Todo = mongoose.model('Todo', todoSchema);

export const todoRepository = {
  list: () => Todo.find().sort({ createdAt: -1, _id: -1 }),
  create: (data) => Todo.create(data),
  update: (id, data) => Todo.findByIdAndUpdate(id, data, { new: true, runValidators: true }),
  // A pipeline makes the toggle atomic even when requests overlap.
  toggle: (id) => Todo.findOneAndUpdate(
    { _id: id },
    [{ $set: { done: { $not: ['$done'] }, updatedAt: '$$NOW' } }],
    { new: true },
  ),
  remove: (id) => Todo.findByIdAndDelete(id),
};
