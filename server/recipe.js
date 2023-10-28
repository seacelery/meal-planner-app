const mongoose = require('mongoose');
const { Schema } = mongoose;

const recipeIngredientSchema = new Schema({
    ingredient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient'
    },
    measurement: String
});

const recipeSchema = new Schema({
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    cuisine: String,
    course: String,
    imageURL: String,
    instructions: String,
    source: String,
    videoURL: String,
    ingredients: [recipeIngredientSchema],
    mainIngredient: String,
    tags: [String],
    cookingTime: String,
    favourited: Boolean,
    calories: Number,
    grams: Number
});

const Recipe = mongoose.model('Recipe', recipeSchema);
exports.Recipe = Recipe;