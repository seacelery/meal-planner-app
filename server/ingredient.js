const mongoose = require('mongoose');
const { Schema } = mongoose;

const ingredientSchema = new Schema({
    name: String,
    discreteWeight: Number,
    kcal: Number
});

const Ingredient = mongoose.model('Ingredient', ingredientSchema);
exports.Ingredient = Ingredient;