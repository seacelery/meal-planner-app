const mongoose = require("mongoose");
const Recipe = require("../recipe").Recipe;
const Ingredient = require("../ingredient").Ingredient;
const PlannerMeal = require("../plannerMeal").PlannerMeal;
const User = require("../user").User;
const bcrypt = require("bcrypt");
const passport = require('passport');
const session = require('express-session');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.status(401).send('Unauthorized');
    };
};

module.exports = function (app) {
    app.get('/login', (req, res) => {
        res.sendFile('login.html', { root: __dirname + '/../public/' });
    });
    
    app.get('/register', (req, res) => {
        res.sendFile('register.html', { root: __dirname + '/../public/' });
    });

    // user authentication routes
    app.post('/register', async (req, res) => {
        try {
            const hash = await bcrypt.hash(req.body.password, 12);
            const newUser = new User({
                email: req.body.email,
                password: hash
            });
            await newUser.save();
            res.redirect('/login.html');
        } catch (error) {
            console.log(error)
            res.redirect('/register.html');
        };
    });

    app.post('/login', passport.authenticate('local', {
        successRedirect: '/myrecipes.html',
        failureRedirect: '/login.html',
        failureFlash: true
    }));

    app.get('/logout', ensureAuthenticated, async (req, res) => {
        req.session.destroy(function (err) {
            res.redirect('/login.html');
        });
    });

    // add a recipe to user db
    app.post('/recipe', ensureAuthenticated, async (req, res) => {
        try {
            const {
                userId, name, cuisine, course, imageURL, instructions, source,
                videoURL, ingredients, mainIngredient, tags, cookingTime,
                favourited, calories, grams
            } = req.body;
    
            const ingredientNames = [];
            let newlyAddedIngredients = []; // To collect newly added ingredients
    
            for (let item of ingredients) {
                let ingredient = await Ingredient.findOne({ name: item.ingredient });
    
                // If ingredient doesn't exist in db, create a new one
                if (!ingredient) {
                    ingredient = new Ingredient({
                        name: item.ingredient,
                        // Add any other default properties for the Ingredient model if needed
                    });
                    await ingredient.save();
                    newlyAddedIngredients.push(item.ingredient);
                }
    
                ingredientNames.push({ ingredient: ingredient._id, measurement: item.measurement });
            }
    
            const recipeInfo = {
                userId, name, cuisine, course, imageURL, instructions, source,
                videoURL, ingredients: ingredientNames, mainIngredient, tags, cookingTime,
                favourited, calories, grams
            };
    
            const newRecipe = new Recipe({
                ...recipeInfo,
                userId: req.user._id
            });
            await newRecipe.save();
    
            if (newlyAddedIngredients.length > 0) {
                res.json({
                    message: "Recipe added successfully. New ingredients were added to the database:",
                    newlyAddedIngredients,
                    recipe: newRecipe
                });
            } else {
                res.json({ message: "Recipe added successfully: ", recipe: newRecipe });
            }
    
        } catch (error) {
            console.error("Error saving the recipe: ", error);
            res.status(500).send('Internal Server Error');
        }
    });

    // add a planner recipe to user db
    app.post('/plannerMeal', ensureAuthenticated, async (req, res) => {
        try {
            const { recipe_id, day, course } = req.body;
            console.log(req.body)

            let newPlannerMeal = await PlannerMeal.findOne({ userId: req.user._id, day: day, course: course });

            if (!newPlannerMeal) {
                // create new obj if it doesn't exist
                newPlannerMeal = new PlannerMeal({
                    day: day,
                    course: course,
                    recipe_id: recipe_id,
                    userId: req.user._id
                });
            } else {
                // update recipe id if it exists
                newPlannerMeal.recipe_id = recipe_id;
            };

            await newPlannerMeal.save();
            return res.json(newPlannerMeal);
        } catch (error) {
            console.error("Error saving the planner meal: ", error);
            res.status(500).send('Internal Server Error');
        };    
    });

    // fetch user's planner recipes
    app.get('/plannerMeal', ensureAuthenticated, async (req, res) => {
        try {
            const plannerRecipes = await PlannerMeal.find({ userId: req.user._id });
            console.log(plannerRecipes)
            return res.json(plannerRecipes);
        } catch (error) {
            console.error("Error getting planner meals: ", error);
            res.status(500).send('Internal Server Error');
        };
    });

    // delete user planner recipe
    app.delete('/plannerMeal/:id', ensureAuthenticated, async (req, res) => {
        try {
            const recipeId = req.params.id;
            await PlannerMeal.findOneAndDelete({ userId: req.user._id, recipe_id: recipeId });
            res.json({ message: "Recipe deleted successfully" });
        } catch (error) {
            console.error("Error deleting planner meal: ", error);
            res.status(500).send('Internal Server Error');
        };
    });
    
    // fetch ingredients by id
    app.get('/ingredient/:id', async (req, res) => {
        try {
            const ingredient = await Ingredient.findById(req.params.id);
            if (!ingredient) {
                return res.status(404).send('Ingredient not found');
            }
            res.json(ingredient);
        } catch (error) {
            console.error("Error fetching the ingredient:", error);
            res.status(500).send('Internal Server Error');
        }
    });

    // fetch user's recipes
    app.get('/recipe', async (req, res) => {
        try {
            const allRecipes = await Recipe.find({ userId: req.user._id }).populate('ingredients.ingredient');
            // Convert ingredient ids to names for use on front end
            const recipesWithGetIngredients = allRecipes.map(recipe => {
                const ingredients = recipe.ingredients.map(ingredientObj => ({
                    ingredient: ingredientObj.ingredient.name,
                    measurement: ingredientObj.measurement
                }))
                return { ...recipe._doc, ingredients };
            })
            res.json(recipesWithGetIngredients);
        } catch (error) {
            console.error("Failed to retrieve recipes: ", error);
            res.status(500).send("Internal Server Error");
        };
    });

    // delete user recipe
    app.delete('/recipe/:id', ensureAuthenticated, async (req, res) => {
        try {
            const recipeId = req.params.id;

            await Recipe.findOneAndDelete({ _id: recipeId, userId: req.user._id });
            res.json({ message: "Recipe deleted successfully" });
        } catch (error) {
            console.error("Failed to delete recipe: ", error);
            res.status(500).send("Internal Server Error");
        };
    });

    // update favourite status of recipe
    app.patch('/recipe/:id', ensureAuthenticated, async (req, res) => {
        try {
            const recipeId = req.params.id;
            

            const recipe = await Recipe.findOne({ _id: recipeId, userId: req.user._id });

            // Check if the recipe was found
            if (!recipe) {
                res.status(404).send("Recipe not found or unauthorized");
                return;
            }

            // Update the favourited status to its opposite
            recipe.favourited = !recipe.favourited;

            // Save the changes
            const updatedRecipe = await recipe.save();
            

            res.json({ message: "Recipe edited successfully", recipe: updatedRecipe });
        } catch (error) {
            console.error("Failed to edit recipe: ", error);
            res.status(500).send("Internal Server Error");
        };
    });
};