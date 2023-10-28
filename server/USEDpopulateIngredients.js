const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

// Your Ingredient Schema (ensure it's the same as in your main app)
const ingredientSchema = new mongoose.Schema({
    name: String,
    discreteWeight: Number,
    kcal: Number
});

const Ingredient = mongoose.model('Ingredient', ingredientSchema);

const ingredientWeights = {
    "dry white wine": {
        kcal: 82
    },
    "Dry White Wine": {
        kcal: 82
    },
};

const insertIngredients = async () => {
    for (const [name, data] of Object.entries(ingredientWeights)) {
        const ingredient = new Ingredient({
            name: name,
            discreteWeight: data.discreteWeight,
            kcal: data.kcal
        });
        await ingredient.save();
    }

    console.log('All ingredients inserted!');
    mongoose.connection.close();
};

insertIngredients();