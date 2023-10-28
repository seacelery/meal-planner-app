const mongoose = require('mongoose');
const { Schema } = mongoose;

const plannerMealSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'  // Assuming you have a User model
    },
    day: String,
    course: String,
    recipe_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipe"
    }
});

const PlannerMeal = mongoose.model('PlannerMeal', plannerMealSchema);
exports.PlannerMeal = PlannerMeal;