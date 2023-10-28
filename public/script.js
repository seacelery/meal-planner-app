/* to do */
/*

*/

// Fetching ingredientWeights object
const fetchIngredientWeights = () => {
    fetch('ingredientWeights.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        ingredientWeights = data;
        console.log(ingredientWeights);
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });
};

let ingredientWeights = {};
fetchIngredientWeights();

// convert quantity functions
const fractionToDecimal = (fraction) => {
    const [numerator, denominator] = fraction.split('/').map(Number);
    return denominator ? numerator / denominator : numerator;
};

const convertCupsQuantityToNumber = (quantity) => {
    const unicodeFractions = {
        '½': 0.5,
        '¼': 0.25,
        '¾': 0.75,
    };

    let result = quantity.match(/(\d+\s?\d*\/?\d*|½|¼|¾)\s*cups?/i);

    if (result) {
        result = result[1];
        if (result.includes(' ')) {
            const parts = result.split(' ');
            return parseInt(parts[0], 10) + (unicodeFractions[parts[1]] || fractionToDecimal(parts[1]));
        } else if (result.includes('/')) {
            return fractionToDecimal(result);
        } else if (unicodeFractions[result]) {
            return unicodeFractions[result];
        } else {
            return parseInt(result, 10);
        };
    };
    return null;
};

// Class for recipes added by user
class AddRecipe {
    constructor(apiData, userId, favourite) {
        console.log("converting recipe")
        let extractedIngredients = this.extractIngredients(apiData) || [];

        this.id = apiData._id || userId;
        this.name = apiData.name;
        this.cuisine = apiData.cuisine;
        this.course = apiData.course;
        this.imageURL = apiData.imageURL;
        this.instructions = apiData.instructions;
        this.source = apiData.source;
        this.videoURL = apiData.videoURL;
        this.ingredients = extractedIngredients || [""];
        this.mainIngredient = extractedIngredients[0] === undefined ? "" : extractedIngredients[0].ingredient;
        this.tags = apiData.tags;
        this.cookingTime = this.calculateTime(apiData);
        this.favourited = apiData.favourited;

        const { convertedIngredients, totalCalories, totalGrams } = this.convertIngredients(this.ingredients);
        this.convertedIngredients = convertedIngredients;
        this.calories = Math.round(totalCalories / (totalGrams / 100)) || 1;
        this.grams = totalGrams || 1;
    };

    calculateTime(data) {
        let text = data.strInstructions || data.cookingTime;
        if (!text) return;

        const matches = String(text).match(/(\d+-)?\d+\s*(min(ute)?s?)?/gi);
        // let timeValue = 0;
        // for (let i = 0; i < matches.length; i++) {
        //     let matchToReplace = matches[i].replace(/(\d)\sminutes?/gi, '$1');
        //     timeValue += Number(matchToReplace);
        // };
        
        if (matches === null) return "N/A";

        const timeValue = matches.reduce((acc, val) => {
            return acc + parseInt(val, 10)}, 0
        );

        switch(true) {
            case timeValue < 60:
                return timeValue + " minutes";
            case timeValue > 60 && timeValue < 120:
                return Math.floor(timeValue / 60) + " hour " + (timeValue - Math.floor(timeValue / 60) * 60) + " minutes";
            case timeValue > 120:
                return Math.floor(timeValue / 60) + " hours " + (timeValue - Math.floor(timeValue / 60) * 60) + " minutes";
        };

        return timeValue + " minutes";      
    };

    extractIngredients(data) {
        let ingredients = [];

        for (const ingredient of data.ingredients) {
            ingredients.push({
                ingredient: ingredient.ingredient,
                measurement: ingredient.measurement          
            });
        };
        // console.log(ingredients)
        return ingredients;
    };

    convertIngredients(ingredients) {
        let convertedIngredients = [];
        let convertedIngredient;
        let totalGrams = 0;
        let totalCalories = 0;

        const convertIngredientWeights = (ingredient, quantity) => {
            const normalisedIngredient = ingredient.toLowerCase().trim();
            // console.log(normalisedIngredient)
            
            let normalisedQuantity;
            // console.log(quantity)

            const convertFromKg = () => {
                normalisedQuantity = quantity.replace(/(\d[.]\d)\s?kg/gi, "$1");
                // console.log("kg item")

                totalGrams += 1 * normalisedQuantity * 1000;
                totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 1000 / 100;
                
                return convertedIngredient = { 
                    grams: normalisedQuantity * 1000,
                    kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 1000 / 100,
                    unit: "kg"
                };
            };

            const convertFromTsp = () => {
                normalisedQuantity = quantity.replace(/(\d*)\s?(tb?l?sp?|tablespoons?|teaspoons?)(\s\w*)?/gi, "$1")
                // console.log("tsp item")
                // console.log(quantity)
                // console.log(normalisedQuantity)

                totalGrams += 1 * normalisedQuantity * 6;
                totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 6 / 100;
                
                return convertedIngredient = { 
                    grams: normalisedQuantity * 6,
                    kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 6 / 100,
                    unit: "tsp"
                };
            };

            const convertFromGrams = () => {
                normalisedQuantity = quantity.replace(/(\d+)\s?g(rams)?(\s?(\w*)?)*/gi, "$1");
                
                totalGrams += 1 * normalisedQuantity;
                totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100;
                
                return convertedIngredient = { 
                    grams: normalisedQuantity ,
                    kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100,
                    unit: "g"
                };
            };

            const convertFromOz = () => {
                normalisedQuantity = quantity.replace(/(\d+)\s?oz(\s?(\w*)?)*/gi, "$1");
                // console.log("ounces")
                // console.log(normalisedQuantity)
            
                totalGrams += 1 * normalisedQuantity * 28.3495;
                totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 28.3495 / 100;
                
                return convertedIngredient = { 
                    grams: normalisedQuantity * 28.3495,
                    kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 28.3495 / 100,
                    unit: "g"
                };
            };

            const convertFromCups = () => {
                // console.log("trying to convert cups")
                normalisedQuantity = convertCupsQuantityToNumber(quantity);
                // console.log("cup item")
                

                totalGrams += 1 * normalisedQuantity * 250;
                totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 250 / 100;
                
                return convertedIngredient = { 
                    grams: normalisedQuantity * 250,
                    kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 250 / 100,
                    unit: /(\d)\scup/gi.test(quantity) ? " cup" : " cups"
                };
            };

            const convertFromMl = () => {
                normalisedQuantity = quantity.replace(/(\d+)ml/gi, "$1");
                // console.log("ml item")

                totalGrams += 1 * normalisedQuantity;
                totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100;

                return convertedIngredient = { 
                    grams: normalisedQuantity,
                    kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100,
                    unit: "ml"
                };
            };

            const convertComplexDiscreteItems = () => {
                normalisedQuantity = quantity.replace(/(\d*)\s(\w*)/gi, "$1");
                // console.log("discrete item")

                totalGrams += (ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity || 1);
                totalCalories += (ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100)) || 1;
                
                return convertedIngredient = { 
                    grams: (ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity) || 1,
                    kcal: (ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100)) || 1,
                    unit: "g"
                };
            };

            const convertSimpleDiscreteItems = () => {
                normalisedQuantity = quantity.replace(/(\d*)\s(\w*)/gi, "$1");
                // console.log("discrete item 2")

                totalGrams += (ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity) || 1;
                totalCalories += (ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100)) || 1;
                
                return convertedIngredient = { 
                    grams: (ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity) || 1,
                    kcal: (ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100)) || 1,
                    unit: "g"
                };
            };

            // console.log(quantity)
            switch(true) {
                case /^[^\d]*$/.test(quantity):
                    return convertedIngredient = ingredientWeights[normalisedIngredient] * normalisedQuantity;
                // convert kg
                case /(\d[.]\d)\s?kg/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertFromKg();
                // convert tsp
                case /(\d*)\s?(tb?sp?|tablespoons?|teaspoons?)/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertFromTsp();
                // convert grams
                case /(\d+)\s?g(rams)?/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertFromGrams();
                // convert oz
                case /(\d+)\s?oz/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertFromOz();
                // convert cups
                case /(\d+\s?\d*\/?\d*|½|¼|¾)\s*cups?/i.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertFromCups();
                // convert ml
                case /(\d+)ml/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertFromMl();
                // convert lbs
                // case /(\d+)lb/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                //     normalisedQuantity = quantity.replace(/(\d+)lb/gi, "$1");
                //     console.log("ml item")

                //     totalGrams += ingredientWeights[normalisedIngredient].weight * normalisedQuantity;
                //     totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100;

                //     return convertedIngredient = { 
                //         grams: ingredientWeights[normalisedIngredient].weight * normalisedQuantity,
                //         kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100,
                //         unit: "ml"
                //     };
                // convert discrete items (12 chicken thighs)
                case /^\d+\s(?!cup|cups\b).+$/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertComplexDiscreteItems();
                    // convert discrete items with no extra words (2 green chilli)
                case /(\d*)(\s(\w*))*/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertSimpleDiscreteItems();

                default:
                    return convertedIngredient = ingredientWeights[normalisedIngredient] * normalisedQuantity;
            };
        };

        // console.log(ingredients)
        ingredients.forEach(ingredient => {         
            convertIngredientWeights(ingredient.ingredient, ingredient.measurement);
                
            // if (!convertedIngredient) {
            //     convertedIngredient = {
            //         grams: 1,
            //         kcal: 1, 
            //         unit: 'g'
            //     };
            // };
            // console.log(convertedIngredient)
                           
            if (convertedIngredient) {
                convertedIngredients.push({
                    ingredient: ingredient.ingredient,
                    measurement: convertedIngredient.grams + "g",             
                    calories: convertedIngredient.kcal + " calories"
                });
            } else {
                convertedIngredients.push({
                    ingredient: ingredient.ingredient,
                    measurement: ingredient                                                                                                                                                                .measurement,
                    calories: 0
                });
            };
        });

        // console.log(convertedIngredients)
        // console.log(totalGrams + " grams")
        // console.log(totalCalories + " calories")
        
        return { convertedIngredients, totalCalories, totalGrams }
    };
};

// test Class for recipes received from api
class Recipe {
    constructor(apiData, favourite) {
        let extractedIngredients = this.extractIngredients(apiData);

        this.name = apiData.strMeal;
        this.cuisine = apiData.strArea;
        this.course = apiData.strCategory;
        this.imageURL = apiData.strMealThumb;
        this.instructions = apiData.strInstructions;
        this.source = apiData.strSource;
        this.videoURL = apiData.strYoutube;
        this.ingredients = extractedIngredients;
        this.mainIngredient = extractedIngredients[0].ingredient;
        this.tags = apiData.strTags;
        this.cookingTime = this.calculateTime(apiData);
        this.favourited = favourite;

        const { convertedIngredients, totalCalories, totalGrams } = this.convertIngredients(this.ingredients);
        this.convertedIngredients = convertedIngredients;
        this.calories = Math.round(totalCalories / (totalGrams / 100));
        this.grams = totalGrams;
    };

    calculateTime(data) {
        let text = data.strInstructions;
        const matches = text.match(/(\d+-)?\d+\s*min(ute)?s?/gi);
        // let timeValue = 0;
        // for (let i = 0; i < matches.length; i++) {
        //     let matchToReplace = matches[i].replace(/(\d)\sminutes?/gi, '$1');
        //     timeValue += Number(matchToReplace);
        // };
        
        if (matches === null) return "N/A";

        const timeValue = matches.reduce((acc, val) => {
            return acc + parseInt(val, 10)}, 0
        );

        switch(true) {
            case timeValue < 60:
                return timeValue + " minutes";
            case timeValue > 60 && timeValue < 120:
                return Math.floor(timeValue / 60) + " hour " + (timeValue - Math.floor(timeValue / 60) * 60) + " minutes";
            case timeValue > 120:
                return Math.floor(timeValue / 60) + " hours " + (timeValue - Math.floor(timeValue / 60) * 60) + " minutes";
        };

        return timeValue + " minutes";      
    };

    extractIngredients(data) {
        let ingredients = [];

        for (let i = 1; i <= 20; i++) {
            if (data[`strIngredient${i}`] !== "" && data[`strIngredient${i}`] !== null) {
                ingredients.push({
                    ingredient: data[`strIngredient${i}`].split(' ')
                                                         .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                                         .join(' '),
                    measurement: data[`strMeasure${i}`]
                });
            };
        };
        return ingredients;
    };

    convertIngredients(ingredients) {
        console.log(ingredients)

        let convertedIngredients = [];
        let convertedIngredient;
        let totalGrams = 0;
        let totalCalories = 0;

        const convertIngredientWeights = (ingredient, quantity) => {
            const normalisedIngredient = ingredient.toLowerCase().replace(/s$/,'').trim();
            console.log(normalisedIngredient)
            
            let normalisedQuantity;
            // console.log(quantity)

            const convertFromKg = () => {
                normalisedQuantity = quantity.replace(/(\d[.]\d)\s?kg/gi, "$1");
                console.log("kg item")

                totalGrams += 1 * normalisedQuantity * 1000;
                totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 1000 / 100;
                
                return convertedIngredient = { 
                    grams: normalisedQuantity * 1000,
                    kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 1000 / 100,
                    unit: "kg"
                };
            };

            const convertFromGrams = () => {
                normalisedQuantity = quantity.replace(/(\d+)\s?g(rams)?(\s?(\w*)?)*/gi, "$1");
                
                totalGrams += 1 * normalisedQuantity;
                totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100;
                
                return convertedIngredient = { 
                    grams: normalisedQuantity,
                    kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100,
                    unit: "g"
                };
            };

            const convertFromOz = () => {
                normalisedQuantity = quantity.replace(/(\d+)\s?oz(\s?(\w*)?)*/gi, "$1");
                console.log("ounces")
                console.log(normalisedQuantity)
            
                totalGrams += 1 * normalisedQuantity * 28.3495;
                totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 28.3495 / 100;
                
                return convertedIngredient = { 
                    grams: normalisedQuantity * 28.3495,
                    kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 28.3495 / 100,
                    unit: "g"
                };
            };

            const convertFromCups = () => {
                normalisedQuantity = convertCupsQuantityToNumber(quantity);
                // console.log("cup item")
                

                totalGrams += 1 * normalisedQuantity * 250;
                totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 250 / 100;
                
                return convertedIngredient = { 
                    grams: normalisedQuantity * 250,
                    kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 250 / 100,
                    unit: /(\d)\scup/gi.test(quantity) ? " cup" : " cups"
                };
            };

            const convertFromMl = () => {
                normalisedQuantity = quantity.replace(/(\d+)ml/gi, "$1");
                // console.log("ml item")

                totalGrams += 1 * normalisedQuantity;
                totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100;

                return convertedIngredient = { 
                    grams: normalisedQuantity,
                    kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100,
                    unit: "ml"
                };
            };

            const convertComplexDiscreteItems = () => {
                normalisedQuantity = quantity.replace(/(\d*)\s(\w*)/gi, "$1");
                // console.log("discrete item")

                totalGrams += ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity;
                totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100);
                
                return convertedIngredient = { 
                    grams: ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity,
                    kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100),
                    unit: "g"
                };
            };

            const convertSimpleDiscreteItems = () => {
                normalisedQuantity = quantity.replace(/(\d*)\s(\w*)/gi, "$1");
                // console.log("discrete item 2")

                totalGrams += ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity;
                totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100);
                
                return convertedIngredient = { 
                    grams: ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity,
                    kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100),
                    unit: "g"
                };
            };

            switch(true) {
                case /^[^\d]*$/.test(quantity):
                    return convertedIngredient = ingredientWeights[normalisedIngredient] * normalisedQuantity;
                // convert kg
                case /(\d[.]\d)\s?kg/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertFromKg();
                // convert grams
                case /(\d+)\s?g(rams)?/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertFromGrams();
                // convert oz
                case /(\d+)\s?oz/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertFromOz();
                // convert cups
                case /(\d+\s?\d*\/?\d*|½|¼|¾)\s*cups?/i.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertFromCups();
                // convert ml
                case /(\d+)ml/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertFromMl();
                // convert lbs
                // case /(\d+)lb/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                //     normalisedQuantity = quantity.replace(/(\d+)lb/gi, "$1");
                //     console.log("ml item")

                //     totalGrams += ingredientWeights[normalisedIngredient].weight * normalisedQuantity;
                //     totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100;

                //     return convertedIngredient = { 
                //         grams: ingredientWeights[normalisedIngredient].weight * normalisedQuantity,
                //         kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100,
                //         unit: "ml"
                //     };
                // convert discrete items (12 chicken thighs)
                case /^\d+\s(?!cup|cups\b).+$/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertComplexDiscreteItems();
                    // convert discrete items with no extra words (2 green chilli)
                case /(\d*)(\s(\w*))*/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                    return convertSimpleDiscreteItems();

                default:
                    return convertedIngredient = ingredientWeights[normalisedIngredient] * normalisedQuantity;
            };
        };

        ingredients.forEach(ingredients => {         
                convertIngredientWeights(ingredients.ingredient, ingredients.measurement);
                console.log(convertedIngredient)
                           
            if (convertedIngredient) {
                convertedIngredients.push({
                    ingredient: ingredients.ingredient,
                    measurement: convertedIngredient.grams + "g",             
                    calories: convertedIngredient.kcal + " calories"
                });
            } else {
                convertedIngredients.push({
                    ingredient: ingredients.ingredient,
                    measurement: ingredients.measurement,
                    calories: 0
                });
            };
        });

        console.log(convertedIngredients)
        console.log(totalGrams + " grams")
        console.log(totalCalories + " calories")
        
        return { convertedIngredients, totalCalories, totalGrams }
    };
};

let myRecipesArr = {
    "meals": []
};

let findRecipesArr = {
    "meals": []
};

// API FUNCTIONS
function log(message, data) {
    console.log(message);
    if (data) {
        console.log(data);
    };
};

async function fetchMealDBData(apiUrl) {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const recipes = await response.json();
        log("Making an API call from fetchMealDBData.", recipes);
        return recipes;
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return [];
    };
};

async function fetchMealDBDataWithCache(apiUrl) {
    const cacheKey = apiUrl;

    try {
        const cachedData = localStorage.getItem(cacheKey);
        const cachedDuration = 10800000;

        if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            const currentTime = new Date().getTime();
            if (currentTime - timestamp < cachedDuration) {
                log("Fetching data from cache", data);
                return data;
            };
        };

        const recipes = await fetchMealDBData(apiUrl);
        localStorage.setItem(cacheKey, JSON.stringify({
            data: recipes,
            timestamp: new Date().getTime()
        }));
        return recipes;

    } catch (error) {
        console.error('Error fetching recipes:', error);
        return [];
    };
};

// Show loading animation
const showLoading = () => {
    const loadingDiv = document.getElementById("loading-div");
    const loader = document.getElementById("loader");
    loadingDiv.style.display = "block";
    loadingDiv.style.backgroundColor = "rgba(0, 0, 0, 0.2)"
    loader.style.display = "block";
};

// Hide loading animation
const hideLoading = () => {
    const loadingDiv = document.getElementById("loading-div");
    const loader = document.getElementById("loader");
    loadingDiv.style.display = "none";
    loadingDiv.style.backgroundColor = "rgba(255, 255, 255, 1)";
    loader.style.display = "none";
};

// DB FUNCTIONS
const getUserRecipes = async () => {
    showLoading();
    try {
        const res = await fetch('/recipe', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        hideLoading();
        const data = await res.json();
        const recipes = data.map(recipe => new AddRecipe(recipe));
        myRecipesArr.meals.push(...recipes);
        if (currentPage === "myRecipes") {
            populateMyRecipesFilterLists();
            createMyRecipesGrid();
        }
        return recipes;
    } catch (error) {
        console.error('Error:', error);
    }
};

const deleteRecipe = (recipeId) => {
    showLoading();
    fetch(`/recipe/${recipeId}`, {
        method: 'DELETE'
    })
    .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        hideLoading();
        return res.json();
    })
    .then(data => {
        console.log(data.message)
        myRecipesArr.meals = myRecipesArr.meals.filter(recipe => recipe.id !== recipeId);
        console.log(myRecipesArr)
        createMyRecipesGrid();
        populateMyRecipesFilterLists();
    })
    .catch(error => {
        hideLoading();
        console.error("Error deleting the recipe:", error);
        // Maybe show an error message to the user?
    });
};

const updatedFavourited = (recipeId) => {
    fetch(`/recipe/${recipeId}`, {
        method: 'PATCH'
    })
    .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    })
    .then(data => {
        console.log(data.message)

        console.log(myRecipesArr)
    })
    .catch(error => {
        console.error("Error editing the recipe:", error);
        // Maybe show an error message to the user?
    });
};

const createElementWithAttributes = (type, attributes) => {
    const element = document.createElement(type);
    for (let key in attributes) {
        if (attributes.hasOwnProperty(key)) {
            if (key === "classList") {
                attributes[key].forEach(className => element.classList.add(className));
            } else {
                element[key] = attributes[key];
            };
        };
    };
    return element;
};

// CONTENT FUNCTIONS
let filteredRecipesArr = myRecipesArr;

// filter the recipes
const applyMyRecipesFilters = () => {
    const searchbarValue = document.getElementById("bottom-navbar-searchbar").value;
    const courseValue = document.getElementById("course-filter").value;
    const cuisineValue = document.getElementById("cuisine-filter").value;
    const caloriesValue = document.getElementById("calories-filter").value;
    const timeValue = document.getElementById("time-filter").value;

    // Always start with a fresh copy of the original array.
    let filteredMeals = [...myRecipesArr.meals];

    if (favouritesButton.classList.contains("button-on")) {
        filteredMeals = filteredMeals.filter(recipe => recipe.favourited === true);
    };

    filteredMeals = filteredMeals.filter(recipe => recipe.name.toLowerCase().includes(searchbarValue.toLowerCase()));

    if (courseValue !== "Course: All") {
        filteredMeals = filteredMeals.filter(recipe => recipe.course === courseValue);
    };

    if (cuisineValue !== "Cuisine: All") {
        filteredMeals = filteredMeals.filter(recipe => recipe.cuisine === cuisineValue);
    };

    if (caloriesValue === "Low to High") {
        filteredMeals.sort((a, b) => a.calories - b.calories);
    } else if (caloriesValue === "High to Low") {
        filteredMeals.sort((a, b) => b.calories - a.calories);
    };

    const calculateTimeNumber = (str) => {
        console.log("calculating time")
        let matches = str.match(/\d+/gi)
        if (matches.length === 1) {
          return Number(matches[0]);
        } else {
          return Number(matches[0]) * 60 + Number(matches[1]);
        };
      };

    if (timeValue === "Low to High") {
        filteredMeals = filteredMeals.sort((a, b) => calculateTimeNumber(a.cookingTime) - calculateTimeNumber(b.cookingTime));
    } else if (timeValue === "High to Low") {
        filteredMeals = filteredMeals.sort((a, b) => calculateTimeNumber(b.cookingTime) - calculateTimeNumber(a.cookingTime));
    };

    filteredRecipesArr = { meals: filteredMeals };
    console.log("filtered")
    console.log(filteredRecipesArr)
};

// initialise filter event listeners
const myRecipesFilterEventListeners = () => {
    const searchbarFilter = document.getElementById("bottom-navbar-searchbar");
    const courseFilter = document.getElementById("course-filter");
    const cuisineFilter = document.getElementById("cuisine-filter");
    const caloriesFilter = document.getElementById("calories-filter");
    const timeFilter = document.getElementById("time-filter");

    searchbarFilter.addEventListener("input", () => {
        applyMyRecipesFilters();
        createMyRecipesGrid();
    });
    courseFilter.addEventListener("change", () => {
        applyMyRecipesFilters();
        createMyRecipesGrid();
    });
    cuisineFilter.addEventListener("change", () => {
        applyMyRecipesFilters();
        createMyRecipesGrid();
    });
    caloriesFilter.addEventListener("change", () => {
        applyMyRecipesFilters();
        createMyRecipesGrid();
    });
    timeFilter.addEventListener("change", () => {
        applyMyRecipesFilters();
        createMyRecipesGrid();
    });
};

// populate filter lists based on recipes in db
const populateMyRecipesFilterLists = () => {
    const cuisineFilter = document.getElementById("cuisine-filter");
    cuisineFilter.innerHTML = '<option value="Cuisine: All">Cuisine</option>';

    // find unique cuisines and create options for them + increment cuisines that show up more than once
    let cuisineObj = {};

    for (const recipe of myRecipesArr.meals) {
        if (cuisineObj[recipe.cuisine]) {
            cuisineObj[recipe.cuisine]++;
        } else {
            cuisineObj[recipe.cuisine] = 1;
        };
    };

    for (const cuisine in cuisineObj) {         
        const cuisineOption = createElementWithAttributes("option", { value: [`${cuisine}`], textContent: [`${cuisine} (${cuisineObj[cuisine]})`]})
        cuisineFilter.appendChild(cuisineOption)
    };

    const courseFilter = document.getElementById("course-filter");
    courseFilter.innerHTML = '<option value="Course: All">Course</option>';

    let courseObj = {};

    for (const recipe of myRecipesArr.meals) {
        if (courseObj[recipe.course]) {
            courseObj[recipe.course]++;
        } else {
            courseObj[recipe.course] = 1;
        };
    };

    for (const course in courseObj) {         
        const courseOption = createElementWithAttributes("option", { value: [`${course}`], textContent: [`${course} (${courseObj[course]})`]})
        courseFilter.appendChild(courseOption)
    };
};

async function populateFindRecipesFilterLists() {
    const findRecipesSearchbar = document.getElementById("bottom-navbar-searchbar");
    const findRecipesSearchbarButton = document.getElementById("bottom-navbar-searchbar-button");
    const courseFilter = document.getElementById("course-filter");
    const cuisineFilter = document.getElementById("cuisine-filter");
    const dietFilter = document.getElementById("diet-filter");

    findRecipesSearchbar.addEventListener("change", () => {
        findRecipesArr = {
            "meals": []
        };
        getFindRecipes(findRecipesSearchbar.value);
        courseFilter.value = "Course: All";
        cuisineFilter.value = "Cuisine: All";
        dietFilter.value = "Diet: All";
    });

    findRecipesSearchbarButton.addEventListener("change", () => {
        findRecipesArr = {
            "meals": []
        };
        getFindRecipes(findRecipesSearchbar.value);
        courseFilter.value = "Course: All";
        cuisineFilter.value = "Cuisine: All";
        dietFilter.value = "Diet: All";
    });

    // search api for courses and add to filter lists, exclude vegetarian and vegan
    
    // reset display and filter lists on change
    courseFilter.addEventListener("change", () => {
        if (courseFilter.value !== "Course: All") {
            findRecipesArr = {
                "meals": []
            };
            getFindRecipes(courseFilter.value);
            findRecipesSearchbar.value = "";
            cuisineFilter.value = "Cuisine: All";
            dietFilter.value = "Diet: All";
        };
    });

    courseFilter.innerHTML = '<option value="Course: All">Course</option>';
    let courses = await fetchMealDBDataWithCache(`https://www.themealdb.com/api/json/v1/${apiKey}/list.php?c=list`);
    let courseObj = {};

    for (const course of courses.meals) {
        if (course.strCategory !== "Vegetarian" && course.strCategory !== "Vegan") {
            courseObj[course.strCategory]++;
        };
    };

    for (const course in courseObj) {         
        const courseOption = createElementWithAttributes("option", { value: [`${course}`], textContent: [`${course}`]})
        courseFilter.appendChild(courseOption)
    };

    // search api for cuisines and add to filter lists

    // reset display and filter lists on change
    cuisineFilter.addEventListener("change", () => {
        if (cuisineFilter.value !== "Cuisine: All") {
            findRecipesArr = {
                "meals": []
            };
            getFindRecipes(cuisineFilter.value);
            findRecipesSearchbar.value = "";
            courseFilter.value = "Course: All";
            dietFilter.value = "Diet: All";
        };
    });

    cuisineFilter.innerHTML = '<option value="Cuisine: All">Cuisine</option>';
    let cuisines = await fetchMealDBDataWithCache(`https://www.themealdb.com/api/json/v1/${apiKey}/list.php?a=list`);

    let cuisineObj = {};

    for (const cuisine of cuisines.meals) {
        cuisineObj[cuisine.strArea]++;
    };

    for (const cuisine in cuisineObj) {         
        const cuisineOption = createElementWithAttributes("option", { value: [`${cuisine}`], textContent: [`${cuisine}`]})
        cuisineFilter.appendChild(cuisineOption)
    };

    // reset display and filter lists on change
    dietFilter.addEventListener("change", () => {
        if (dietFilter.value !== "Diet: All") {
            findRecipesArr = {
                "meals": []
            };
            getFindRecipes(dietFilter.value);
            findRecipesSearchbar.value =  "";
            courseFilter.value = "Course: All";
            cuisineFilter.value = "Cuisine: All";
        };
    });
};

const populatePlannerFilterLists = (recipes) => {
    const cuisineFilter = document.getElementById("planner-recipes-cuisine-filter");
    cuisineFilter.innerHTML = '<option value="Cuisine: All">Cuisine</option>';

    // find unique cuisines and create options for them + increment cuisines that show up more than once
    let cuisineObj = {};

    for (const recipe of recipes) {
        if (cuisineObj[recipe.cuisine]) {
            cuisineObj[recipe.cuisine]++;
        } else {
            cuisineObj[recipe.cuisine] = 1;
        };
    };

    for (const cuisine in cuisineObj) {         
        const cuisineOption = createElementWithAttributes("option", { value: [`${cuisine}`], textContent: [`${cuisine} (${cuisineObj[cuisine]})`]})
        cuisineFilter.appendChild(cuisineOption)
    };

    const courseFilter = document.getElementById("planner-recipes-course-filter");
    courseFilter.innerHTML = '<option value="Course: All">Course</option>';

    let courseObj = {};

    for (const recipe of recipes) {
        if (courseObj[recipe.course]) {
            courseObj[recipe.course]++;
        } else {
            courseObj[recipe.course] = 1;
        };
    };

    for (const course in courseObj) {         
        const courseOption = createElementWithAttributes("option", { value: [`${course}`], textContent: [`${course} (${courseObj[course]})`]})
        courseFilter.appendChild(courseOption)
    };
};
  
// MY RECIPES CONTENT
const createMyRecipesGrid = () => {
    myRecipesLayout.innerHTML = "";
    applyMyRecipesFilters();
    
    console.log(myRecipesArr)

    console.log(filteredRecipesArr)
    // Iterate over recipes in array and create cards
    filteredRecipesArr.meals.forEach(recipe => {
        const isFavourited = recipe.favourited;
        const newRecipeCard = createMyRecipesCard(recipe, isFavourited);
        newRecipeCard.dataset.id = recipe.id;
        myRecipesLayout.appendChild(newRecipeCard);
    });
};

// Creates recipe display, handles recipe info and selecting recipes
const createMyRecipesCard = (recipe, isFavourited) => {
    const recipeContainer = createElementWithAttributes("div", { classList: ["recipe-container"] });

    // Image box
    const createRecipeImageContainer = (recipe) => {
        const recipeInfoLinkOne = createElementWithAttributes("a", {
            classList: ["recipe-info-link"],
        });

        const recipeImageContainer = createElementWithAttributes("div", { classList: ["recipe-image-container"] });
        const recipeSelectedDiv = createElementWithAttributes("div", { classList: ["recipe-selected-div"] });
        const recipeSelectedIcon = createElementWithAttributes("i", { classList: ["fa-regular", "fa-circle-check"] });

        recipeSelectedDiv.appendChild(recipeSelectedIcon);
        recipeImageContainer.appendChild(recipeSelectedDiv);

        // Clicking on a recipe image in the grid generates an info page
        recipeImageContainer.addEventListener("click", (e) => {
            // when select button is not toggled, display information about the recipe when clicked
            if (selectToggled === false) {
                recipeInfoServingInput.value = Math.floor(recipe.grams / 250);

                // display modal
                populateRecipeInfoModal(recipe, isFavourited);
                recipeInfoModal.style.display = "block";

                recipeInfoServingInput.addEventListener("input", (e) => {
                    let inputType = e.inputType;
                    if (e.target === recipeInfoServingInput && inputType === "deleteContentBackward") {
                        e.target.value = "";
                        return;
                    }
                    // refresh when user changes serving amount
                    populateRecipeInfoModal(recipe, isFavourited);
                });
            // when select button is toggled, allow recipes to be selected and add to array when clicked
            } else if (selectToggled === true) {
                const recipeId = e.currentTarget.closest('[data-id]').dataset.id;
                recipeContainer.classList.toggle("recipe-selected");
                console.log(recipeId)

                // find if recipe is in selected recipes array, if it is then remove it
                const findExistingIndex = selectedRecipesArr.meals.findIndex(recipe => recipe.id === recipeId);
                if (findExistingIndex !== -1) {
                    selectedRecipesArr.meals.splice(findExistingIndex, 1);
                    recipeSelectedDiv.style.display = "none";
                    recipeSelectedIcon.style.display = "none";
                } else {
                    // if it's not, then add it
                    const recipeToAdd = myRecipesArr.meals.find(recipe => recipe.id === recipeId);
                    if (recipeToAdd) {
                        selectedRecipesArr.meals.push(recipeToAdd);
                        recipeSelectedDiv.style.display = "flex";
                        recipeSelectedIcon.style.display = "block";
                    };
                };
                console.log(selectedRecipesArr)
            };
            
        });

        const recipeImage = createElementWithAttributes("img", {
            classList: ["recipe-image"],
            src: recipe.imageURL || "https://www.och-lco.ca/wp-content/uploads/2015/07/unavailable-image.jpg",
            alt: recipe.name
        });

        recipeImageContainer.appendChild(recipeImage);
        recipeInfoLinkOne.appendChild(recipeImageContainer);
        return recipeInfoLinkOne;
    };

    // Text box
    const createRecipeInfoContainer = (recipe) => {
        const recipeInfoContainer = createElementWithAttributes("div", { classList: ["recipe-info-container"] });

        const recipeInfoLinkTwo = createElementWithAttributes("a", {
            classList: ["recipe-info-link"],
        });

        const recipeName = createElementWithAttributes("div", {
            classList: ["recipe-name"],
            textContent: recipe.name
        });

        recipeInfoLinkTwo.appendChild(recipeName);
        recipeInfoContainer.appendChild(recipeInfoLinkTwo);

        const saveRecipeIconDiv = createElementWithAttributes("div", { classList: ["save-recipe-icon-div"] });

        const saveRecipeIcon = createElementWithAttributes("i", {
            classList: ["save-recipe-icon", "fa-regular", "fa-star"]
        });

        // On refresh, updates star fill/colour
        if (isFavourited) {
            saveRecipeIcon.classList.add("favourited");
            saveRecipeIcon.classList.remove("fa-regular");
            saveRecipeIcon.classList.add("fa-solid");
        };

        // Clicking the star fills/unfills, changes colour, edits in database and in array
        saveRecipeIcon.addEventListener("click", (e) => {
            const recipeId = e.currentTarget.closest('[data-id]').dataset.id;
            saveRecipeIcon.classList.toggle("fa-regular");
            saveRecipeIcon.classList.toggle("fa-solid");
            saveRecipeIcon.classList.toggle("favourited");
            recipe.favourited = !recipe.favourited;
            updatedFavourited(recipeId); 
            createMyRecipesGrid();  
            selectedRecipesArr = {
                meals: []
            };         
        });
        saveRecipeIconDiv.appendChild(saveRecipeIcon);

        // Create delete icon to remove recipes
        const deleteRecipeIcon = createElementWithAttributes("i", {
            classList: ["delete-recipe-icon", "fa-solid", "fa-ban"]
        });
        deleteRecipeIcon.addEventListener("click", (e) => {
            const recipeId = e.currentTarget.closest('[data-id]').dataset.id;
            deleteRecipe(recipeId);
            console.log(myRecipesArr)
            
        });

        saveRecipeIconDiv.appendChild(deleteRecipeIcon);
        recipeInfoContainer.appendChild(saveRecipeIconDiv);
        
        return recipeInfoContainer;
    };
    
    const recipeImageElement = createRecipeImageContainer(recipe);
    const recipeInfoElement = createRecipeInfoContainer(recipe);
    
    // Combine image and info
    recipeContainer.appendChild(recipeImageElement);
    recipeContainer.appendChild(recipeInfoElement);

    return recipeContainer;
};

// FIND RECIPES CONTENT
const createFindRecipesGrid = () => {
    myRecipesLayout.innerHTML = "";
    // applyMyRecipesFilters();
    
    console.log(myRecipesArr)

    // console.log(filteredRecipesArr)
    // Iterate over recipes in array and create cards
    findRecipesArr.meals.forEach(recipe => {
        const isFavourited = recipe.favourited;
        const newRecipeCard = createFindRecipesCard(recipe, isFavourited);
        // id?
        newRecipeCard.dataset.id = recipe.id;
        myRecipesLayout.appendChild(newRecipeCard);
    });
};

const createFindRecipesCard = (recipe, isFavourited) => {
    const recipeContainer = createElementWithAttributes("div", { classList: ["recipe-container"] });

    // Image box
    const createRecipeImageContainer = (recipe) => {
        const recipeInfoLinkOne = createElementWithAttributes("a", {
            classList: ["recipe-info-link"],
        });

        const recipeImageContainer = createElementWithAttributes("div", { classList: ["recipe-image-container"] });
        const recipeSelectedDiv = createElementWithAttributes("div", { classList: ["recipe-selected-div"] });
        const recipeSelectedIcon = createElementWithAttributes("i", { classList: ["fa-regular", "fa-circle-check"] });

        recipeSelectedDiv.appendChild(recipeSelectedIcon);
        recipeImageContainer.appendChild(recipeSelectedDiv);

        // Clicking on a recipe image in the grid generates an info page
        recipeImageContainer.addEventListener("click", (e) => {
            // when select button is not toggled, display information about the recipe when clicked
            if (selectToggled === false) {
                recipeInfoServingInput.value = Math.floor(recipe.grams / 250);

                // display modal
                populateRecipeInfoModal(recipe, isFavourited);
                recipeInfoModal.style.display = "block";

                recipeInfoServingInput.addEventListener("input", (e) => {
                    let inputType = e.inputType;
                    if (e.target === recipeInfoServingInput && inputType === "deleteContentBackward") {
                        e.target.value = "";
                        return;
                    }
                    // refresh when user changes serving amount
                    populateRecipeInfoModal(recipe, isFavourited);
                });
            // when select button is toggled, allow recipes to be selected and add to array when clicked
            } else if (selectToggled === true) {
                const recipeId = e.currentTarget.closest('[data-id]').dataset.id;
                recipeContainer.classList.toggle("recipe-selected");
                console.log(recipeId)

                // find if recipe is in selected recipes array, if it is then remove it
                const findExistingIndex = selectedRecipesArr.meals.findIndex(recipe => recipe.id === recipeId);
                if (findExistingIndex !== -1) {
                    selectedRecipesArr.meals.splice(findExistingIndex, 1);
                    recipeSelectedDiv.style.display = "none";
                    recipeSelectedIcon.style.display = "none";
                } else {
                    // if it's not, then add it
                    const recipeToAdd = myRecipesArr.meals.find(recipe => recipe.id === recipeId);
                    if (recipeToAdd) {
                        selectedRecipesArr.meals.push(recipeToAdd);
                        recipeSelectedDiv.style.display = "flex";
                        recipeSelectedIcon.style.display = "block";
                    };
                };
                console.log(selectedRecipesArr)
            };        
        });

        const recipeImage = createElementWithAttributes("img", {
            classList: ["recipe-image"],
            src: recipe.imageURL || "https://www.och-lco.ca/wp-content/uploads/2015/07/unavailable-image.jpg",
            alt: recipe.name
        });

        recipeImageContainer.appendChild(recipeImage);
        recipeInfoLinkOne.appendChild(recipeImageContainer);
        return recipeInfoLinkOne;
    };

    // Text box
    const createRecipeInfoContainer = (recipe) => {
        const recipeInfoContainer = createElementWithAttributes("div", { classList: ["recipe-info-container"] });

        const recipeInfoLinkTwo = createElementWithAttributes("a", {
            classList: ["recipe-info-link"],
        });

        const recipeName = createElementWithAttributes("div", {
            classList: ["recipe-name"],
            textContent: recipe.name
        });

        const findRecipesAddRecipeDiv = createElementWithAttributes("div", {
            classList: ["find-recipes-add-recipe-div"],
        });

        const findRecipesAddRecipeButton = createElementWithAttributes("div", {
            classList: ["find-recipes-add-recipe-button"],
            textContent: "Add Recipe"
        });

        findRecipesAddRecipeButton.addEventListener("click", () => {
            showLoading();
            fetch('/recipe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(recipe)
            })
            .then(res => {
                hideLoading();
                return res.json()
            })
            .then(data => {
                console.log('Success:', data);
                console.log("carried over")
                findRecipesAddRecipeButton.style.backgroundColor = "rgb(159, 245, 166)";
                findRecipesAddRecipeButton.textContent = "Recipe Added";
                findRecipesAddRecipeButton.style.pointerEvents = "none";
                findRecipesAddRecipeButton.style.color = "var(--text-colour2)";
            })
            .catch((error) => {
                hideLoading();
                console.error('Error:', error);
            });
        });

        findRecipesAddRecipeDiv.appendChild(findRecipesAddRecipeButton)
        recipeInfoLinkTwo.appendChild(recipeName);
        
        recipeInfoContainer.appendChild(recipeInfoLinkTwo);
        recipeInfoContainer.appendChild(findRecipesAddRecipeDiv)
        
        return recipeInfoContainer;
    };
    
    const recipeImageElement = createRecipeImageContainer(recipe);
    const recipeInfoElement = createRecipeInfoContainer(recipe);
    
    // Combine image and info
    recipeContainer.appendChild(recipeImageElement);
    recipeContainer.appendChild(recipeInfoElement);

    return recipeContainer;
};

async function getFindRecipes(query) {
    if (!query) {
        query = "chicken"
    };
    let recipes = await fetchMealDBDataWithCache(`https://www.themealdb.com/api/json/v1/${apiKey}/search.php?s=${query}`);

    fetch('ingredientWeights.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        ingredientWeights = data;
        for (const recipe in recipes.meals) {
            const ingredients = [];
    
            const extractIngredients = (data) => {
                for (let i = 1; i <= 20; i++) {
                    if (data[`strIngredient${i}`] !== "" && data[`strIngredient${i}`] !== null) {
                        ingredients.push({
                            ingredient: data[`strIngredient${i}`].split(' ')
                                                                 .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                                                 .join(' '),
                            measurement: data[`strMeasure${i}`]
                        });
                    };
                };
                return ingredients;
            };
            extractIngredients(recipes.meals[recipe])
    
            const convertIngredients = (ingredients) => {    
                let convertedIngredients = [];
                let convertedIngredient;
                let totalGrams = 0;
                let totalCalories = 0;
        
                const convertIngredientWeights = (ingredient, quantity) => {
                    const normalisedIngredient = ingredient.toLowerCase().trim();
                    // console.log(normalisedIngredient)
                    
                    let normalisedQuantity;
                    // console.log(quantity)
        
                    const convertFromKg = () => {
                        normalisedQuantity = quantity.replace(/(\d[.]\d)\s?kg/gi, "$1");
                        // console.log("kg item")
        
                        totalGrams += 1 * normalisedQuantity * 1000;
                        totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 1000 / 100;
                        
                        return convertedIngredient = { 
                            grams: normalisedQuantity * 1000,
                            kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 1000 / 100,
                            unit: "kg"
                        };
                    };
        
                    const convertFromTsp = () => {
                        normalisedQuantity = quantity.replace(/(\d*)\s?(tb?l?sp?|tablespoons?|teaspoons?)(\s\w*)?/gi, "$1")
                        // console.log("tsp item")
                        // console.log(quantity)
                        // console.log(normalisedQuantity)
        
                        totalGrams += 1 * normalisedQuantity * 6;
                        totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 6 / 100;
                        
                        return convertedIngredient = { 
                            grams: normalisedQuantity * 6,
                            kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 6 / 100,
                            unit: "tsp"
                        };
                    };
        
                    const convertFromGrams = () => {
                        normalisedQuantity = quantity.replace(/(\d+)\s?g(rams)?(\s?(\w*)?)*/gi, "$1");
                        
                        totalGrams += 1 * normalisedQuantity;
                        totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100;
                        
                        return convertedIngredient = { 
                            grams: normalisedQuantity ,
                            kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100,
                            unit: "g"
                        };
                    };
        
                    const convertFromOz = () => {
                        normalisedQuantity = quantity.replace(/(\d+)\s?oz(\s?(\w*)?)*/gi, "$1");
                        // console.log("ounces")
                        // console.log(normalisedQuantity)
                    
                        totalGrams += 1 * normalisedQuantity * 28.3495;
                        totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 28.3495 / 100;
                        
                        return convertedIngredient = { 
                            grams: normalisedQuantity * 28.3495,
                            kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 28.3495 / 100,
                            unit: "g"
                        };
                    };
        
                    const convertFromCups = () => {
                        // console.log("trying to convert cups")
                        normalisedQuantity = convertCupsQuantityToNumber(quantity);
                        // console.log("cup item")
                        
        
                        totalGrams += 1 * normalisedQuantity * 250;
                        totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 250 / 100;
                        
                        return convertedIngredient = { 
                            grams: normalisedQuantity * 250,
                            kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 250 / 100,
                            unit: /(\d)\scup/gi.test(quantity) ? " cup" : " cups"
                        };
                    };
        
                    const convertFromMl = () => {
                        normalisedQuantity = quantity.replace(/(\d+)ml/gi, "$1");
                        // console.log("ml item")
        
                        totalGrams += 1 * normalisedQuantity;
                        totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100;
        
                        return convertedIngredient = { 
                            grams: normalisedQuantity,
                            kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100,
                            unit: "ml"
                        };
                    };
        
                    const convertComplexDiscreteItems = () => {
                        normalisedQuantity = quantity.replace(/(\d*)\s(\w*)/gi, "$1");
                        // console.log("discrete item")
        
                        totalGrams += (ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity || 1);
                        totalCalories += (ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100)) || 1;
                        
                        return convertedIngredient = { 
                            grams: (ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity) || 1,
                            kcal: (ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100)) || 1,
                            unit: "g"
                        };
                    };
        
                    const convertSimpleDiscreteItems = () => {
                        normalisedQuantity = quantity.replace(/(\d*)\s(\w*)/gi, "$1");
                        // console.log("discrete item 2")
        
                        totalGrams += (ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity) || 1;
                        totalCalories += (ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100)) || 1;
                        
                        return convertedIngredient = { 
                            grams: (ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity) || 1,
                            kcal: (ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100)) || 1,
                            unit: "g"
                        };
                    };
        
                    // console.log(quantity)
                    // console.log(convertedIngredient)
                    // console.log(/(\d[.]\d)\s?kg/gi.test(quantity))
                    // console.log(ingredientWeights[normalisedIngredient])
                    switch(true) {
                        case /^[^\d]*$/.test(quantity):
                            return convertedIngredient = ingredientWeights[normalisedIngredient] * normalisedQuantity;
                        // convert kg
                        case /(\d[.]\d)\s?kg/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertFromKg();
                        // convert tsp
                        case /(\d*)\s?(tb?sp?|tablespoons?|teaspoons?)/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertFromTsp();
                        // convert grams
                        case /(\d+)\s?g(rams)?/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertFromGrams();
                        // convert oz
                        case /(\d+)\s?oz/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertFromOz();
                        // convert cups
                        case /(\d+\s?\d*\/?\d*|½|¼|¾)\s*cups?/i.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertFromCups();
                        // convert ml
                        case /(\d+)ml/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertFromMl();
                        // convert lbs
                        // case /(\d+)lb/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                        //     normalisedQuantity = quantity.replace(/(\d+)lb/gi, "$1");
                        //     console.log("ml item")
        
                        //     totalGrams += ingredientWeights[normalisedIngredient].weight * normalisedQuantity;
                        //     totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100;
        
                        //     return convertedIngredient = { 
                        //         grams: ingredientWeights[normalisedIngredient].weight * normalisedQuantity,
                        //         kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100,
                        //         unit: "ml"
                        //     };
                        // convert discrete items (12 chicken thighs)
                        case /^\d+\s(?!cup|cups\b).+$/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertComplexDiscreteItems();
                            // convert discrete items with no extra words (2 green chilli)
                        case /(\d*)(\s(\w*))*/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertSimpleDiscreteItems();
        
                        default:
                            return convertedIngredient = ingredientWeights[normalisedIngredient] * normalisedQuantity;
                    };
                };
        
                ingredients.forEach(ingredients => {   
                    // console.log(ingredients)      
                    convertIngredientWeights(ingredients.ingredient, ingredients.measurement);
                        
                    // if (!convertedIngredient) {
                    //     convertedIngredient = {
                    //         grams: 1,
                    //         kcal: 1, 
                    //         unit: 'g'
                    //     };
                    // };
                    // console.log(convertedIngredient)
                                   
                    if (convertedIngredient) {
                        convertedIngredients.push({
                            ingredient: ingredients.ingredient,
                            measurement: convertedIngredient.grams + "g",             
                            calories: convertedIngredient.kcal + " calories"
                        });
                    } else {
                        convertedIngredients.push({
                            ingredient: ingredients.ingredient,
                            measurement: ingredients.measurement,
                            calories: 0
                        });
                    };
                });
        
                // console.log(convertedIngredients)
                // console.log(totalGrams + " grams")
                // console.log(totalCalories + " calories")
                return { convertedIngredients, totalCalories, totalGrams }
            };
        
            totalGrams = (convertIngredients(ingredients).totalGrams) || 1;
            totalCalories = Math.round(convertIngredients(ingredients).totalCalories / (totalGrams / 100)) || 1;
    
            let cookingTime = "";
            const calculateTime = (data) => {
                let text = data.strInstructions || data.cookingTime;
                if (!text) return;
    
                const matches = String(text).match(/(\d+-)?\d+\s*min(ute)?s?/gi);
                // let timeValue = 0;
                // for (let i = 0; i < matches.length; i++) {
                //     let matchToReplace = matches[i].replace(/(\d)\sminutes?/gi, '$1');
                //     timeValue += Number(matchToReplace);
                // };
                if (matches === null) return "N/A";
    
                const timeValue = matches.reduce((acc, val) => {
                    return acc + parseInt(val, 10)}, 0
                );
    
                switch(true) {
                    case timeValue < 60:
                        return timeValue + " minutes";
                    case timeValue > 60 && timeValue < 120:
                        return Math.floor(timeValue / 60) + " hour " + (timeValue - Math.floor(timeValue / 60) * 60) + " minutes";
                    case timeValue > 120:
                        return Math.floor(timeValue / 60) + " hours " + (timeValue - Math.floor(timeValue / 60) * 60) + " minutes";
                };
    
                return timeValue + " minutes";      
            };
            cookingTime = calculateTime(recipes.meals[recipe]);
            // console.log(recipes.meals[recipe])
            const recipeData = {
                name: recipes.meals[recipe].strMeal,
                cuisine: recipes.meals[recipe].strArea,
                source: recipes.meals[recipe].strSource,
                imageURL: recipes.meals[recipe].strMealThumb,
                course: recipes.meals[recipe].strCategory,
                ingredients: ingredients,
                mainIngredient: ingredients[0].ingredient,
                cookingTime: cookingTime,
                instructions: recipes.meals[recipe].strInstructions,
                calories: totalCalories,
                grams: totalGrams,
                favourited: false
            };
    
            console.log("recipe data")
            console.log(recipeData)
    
            const newRecipe = new AddRecipe(recipeData);
            findRecipesArr.meals.push(newRecipe);
        };
        createFindRecipesGrid();
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });
};

// PLANNER CONTENT
const getPlannerRecipes = async () => {
    showLoading();
    try {
        const res = await fetch('/plannerMeal', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        hideLoading();
        const data = await res.json();
        console.log(data)
        return data;
    } catch (error) {
        console.error('Error:', error);
    };
};

const populatePlannerRecipesBar = async () => {
    // filter recipes array
    const applyPlannerFilters = (recipes) => {
        const searchbarValue = document.getElementById("planner-recipes-searchbar").value;
        const courseValue = document.getElementById("planner-recipes-course-filter").value;
        const cuisineValue = document.getElementById("planner-recipes-cuisine-filter").value;
        const favouritesButton = document.getElementById("planner-recipes-favourites-button");

        let filteredMeals = [...recipes];
        console.log(filteredMeals)

        if (favouritesButton.classList.contains("button-on")) {
            filteredMeals = filteredMeals.filter(recipe => recipe.favourited === true);
        };

        filteredMeals = filteredMeals.filter(recipe => recipe.name.toLowerCase().includes(searchbarValue.toLowerCase()));


        console.log(courseValue)
        console.log(cuisineValue)
        if (courseValue !== "Course: All") {
            filteredMeals = filteredMeals.filter(recipe => recipe.course === courseValue);
            console.log(filteredMeals)
        };

        if (cuisineValue !== "Cuisine: All") {
            filteredMeals = filteredMeals.filter(recipe => recipe.cuisine === cuisineValue);
        };

        return filteredMeals;
    };

    // display the recipes in db
    const generatePlannerRecipes = (recipes) => {
        console.log(recipes)
        const recipesContainer = document.getElementById("planner-recipes-bar-container");
        recipesContainer.innerHTML = "";

        // iterate over recipes and create cards, allow draggable on relevant parts
        recipes.forEach(recipe => {
            const recipeBlock = createElementWithAttributes("div", { 
                classList: ["planner-recipes-bar-recipe"],
                draggable: "true",
                id: recipe.id
            });

            // transfer recipe id
            recipeBlock.addEventListener("dragstart", (e) => {
                const dataToSend = {
                    id: recipe.id
                };
                e.dataTransfer.setData('application/json', JSON.stringify(recipe));
            });

            // allow dropping
            document.querySelectorAll('.planner-tile').forEach(tile => {
                tile.addEventListener('dragover', function(e) {
                    e.preventDefault();
                });
            });

            const recipeImageDiv = createElementWithAttributes("div", { 
                classList: ["planner-recipes-bar-recipe-image-div"], 
            });
            recipeImageDiv.draggable = false;
            
            const recipeImage = createElementWithAttributes("img", { 
                classList: ["planner-recipes-bar-recipe-image"],
                src: recipe.imageURL || "https://www.och-lco.ca/wp-content/uploads/2015/07/unavailable-image.jpg",
            });
            recipeImage.draggable = false;
            const recipeText = createElementWithAttributes("div", { 
                classList: ["planner-recipes-bar-recipe-text"],
                textContent: recipe.name 
            });

            recipeImageDiv.appendChild(recipeImage);
            recipeBlock.appendChild(recipeImageDiv);
            recipeBlock.appendChild(recipeText)
            recipesContainer.appendChild(recipeBlock)
        });
    };

    const plannerFilterEventListeners = () => {
        const searchbarFilter = document.getElementById("planner-recipes-searchbar");
        const courseFilter = document.getElementById("planner-recipes-course-filter");
        const cuisineFilter = document.getElementById("planner-recipes-cuisine-filter");
        const favouritesButton = document.getElementById("planner-recipes-favourites-button");

        favouritesButton.addEventListener("click", () => {
            favouritesButton.classList.toggle("button-on");
            favouritesButton.textContent = favouritesButton.textContent === "Favourites Only: Off" ? "Favourites Only: On" : "Favourites Only: Off";
            let filteredRecipes = applyPlannerFilters(recipes);
            generatePlannerRecipes(filteredRecipes);
        });
    
        searchbarFilter.addEventListener("input", () => {
            let filteredRecipes = applyPlannerFilters(recipes);
            console.log(filteredRecipes)
            generatePlannerRecipes(filteredRecipes);
        });
        courseFilter.addEventListener("change", () => {
            let filteredRecipes = applyPlannerFilters(recipes);
            generatePlannerRecipes(filteredRecipes);
        });
        cuisineFilter.addEventListener("change", () => {
            let filteredRecipes = applyPlannerFilters(recipes);
            generatePlannerRecipes(filteredRecipes);
        });
    };
    // get recipes to populate bar
    const recipes = await getUserRecipes();
    // show all recipes and create dropdowns for filters
    populatePlannerFilterLists(recipes);
    generatePlannerRecipes(recipes);
    // apply event listeners for filters
    plannerFilterEventListeners();

    // get recipes currently in planner
    const plannerRecipes = await getPlannerRecipes();

    // create a new object for planner tile recipes
    let plannerTileRecipes = {
        meals: []
    };
    recipes.forEach(obj1 => {
        plannerRecipes.forEach(obj2 => {
            if (obj1.id === obj2.recipe_id) {
                plannerTileRecipes.meals.push({ 
                    id: obj1.id,
                    name: obj1.name,
                    imageURL: obj1.imageURL,
                    day: obj2.day,
                    course: obj2.course,
                    calories: obj1.calories,
                    ingredients: obj1.ingredients,
                    instructions: obj1.instructions,
                    grams: obj1.grams,
                    cookingTime: obj1.cookingTime,
                });
                
            };
        });
    }); 

    // show delete icons when corner tile is toggled
    const cornerTile = document.getElementById("corner-tile");
    cornerTile.addEventListener("click", () => {
        // highlight icon
        const cornerTileIcon = document.getElementById("corner-tile-icon");
        cornerTileIcon.style.color = cornerTileIcon.style.color === "rgb(255, 61, 61)" ? "var(--border-colour)" : "rgb(255, 61, 61)";
        cornerTile.style.boxShadow = cornerTile.style.boxShadow === "0px 0px 3px var(--border-colour)" ? "none" : "0px 0px 3px var(--border-colour)";
        cornerTile.style.border = cornerTile.style.border === "1px solid var(--border-colour)" ? "1px solid var(--active-colour)" : "1px solid var(--border-colour)";

        document.querySelectorAll(".planner-tile-delete-button-div").forEach(tile => {
            tile.style.display = tile.style.display === "block" ? "none" : "block";
        });
    });
    
    // populate the existing tiles with recipes currently in planner on page load
    document.querySelectorAll('.planner-tile').forEach(tile => {
        // match recipe course/day with tile course/day
        for (const recipe in plannerTileRecipes.meals) {
            if (plannerTileRecipes.meals[recipe].course === tile.getAttribute("course") && plannerTileRecipes.meals[recipe].day === tile.getAttribute("day")) {
                const recipeBlock = createElementWithAttributes("div", { 
                    classList: ["planner-recipes-bar-recipe"],
                    draggable: "true",
                    id: plannerTileRecipes.meals[recipe].id
                });
                recipeBlock.draggable = false;

                const recipeImageDiv = createElementWithAttributes("div", { 
                    classList: ["planner-recipes-bar-recipe-image-div"], 
                });
                recipeImageDiv.draggable = false;
                recipeImageDiv.addEventListener("click", () => {
                    recipeInfoServingInput.value = Math.floor(plannerTileRecipes.meals[recipe].grams / 250);
                    populateRecipeInfoModal(plannerTileRecipes.meals[recipe]);
                    recipeInfoModalPlanner.style.display = "block";
                });
                recipeImageDiv.style.cursor = "pointer";
                const recipeImage = createElementWithAttributes("img", { 
                    classList: ["planner-recipes-bar-recipe-image"],
                    src: plannerTileRecipes.meals[recipe].imageURL || "https://www.och-lco.ca/wp-content/uploads/2015/07/unavailable-image.jpg",
                });
                recipeImage.draggable = false;
                const recipeText = createElementWithAttributes("div", { 
                    classList: ["planner-recipes-bar-recipe-text"],
                    textContent: plannerTileRecipes.meals[recipe].name
                });
                recipeImageDiv.appendChild(recipeImage);
                recipeBlock.appendChild(recipeImageDiv);
                recipeBlock.appendChild(recipeText);
                recipeBlock.style.cursor = "auto";

                // create a button to delete a recipe from the planner
                const tileDeleteButton = createElementWithAttributes("div", { 
                    classList: ["planner-tile-delete-button-div"], 
                });
                const tileDeleteButtonIcon = createElementWithAttributes("i", { 
                    classList: ["planner-tile-delete-button-icon", "fa-solid", "fa-ban"], 
                });
                tileDeleteButton.appendChild(tileDeleteButtonIcon);
                tileDeleteButton.addEventListener("click", () => {
                    showLoading();
                    fetch(`/plannerMeal/${plannerTileRecipes.meals[recipe].id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(res => {
                        hideLoading();
                        return res.json()
                    })
                    .then(data => {
                        console.log('Success:', data);
                        console.log("carried over")
                        tileDeleteButton.remove();
                        recipeBlock.remove();
                    })
                    .catch((error) => {
                        hideLoading();
                        console.error('Error:', error);
                    });
                });
                tile.appendChild(tileDeleteButton);
                tile.appendChild(recipeBlock);
            };
        };
    });

    // get recipe id, append recipe to new tile
    // save to db with recipe id as ref
    document.querySelectorAll('.planner-tile').forEach(tile => {
        tile.addEventListener('drop', (e) => {
            e.preventDefault();

            // receive the recipe data for that tile
            const receivedData = JSON.parse(e.dataTransfer.getData('application/json'));

            let recipeId = receivedData.id;
            let recipeDay = tile.getAttribute("day");
            let recipeCourse = tile.getAttribute("course");
    
            let droppedRecipe = document.getElementById(recipeId);

            if (droppedRecipe && !tile.hasChildNodes()) {
                // clone the recipe to reuse it
                let clonedRecipe = droppedRecipe.cloneNode(true);
                clonedRecipe.draggable = false;
                clonedRecipe.classList.add("cloned-recipe");
                droppedRecipe.draggable = true;
        
                // create a button to delete a recipe from the planner
                const tileDeleteButton = createElementWithAttributes("div", { 
                    classList: ["planner-tile-delete-button-div"], 
                });
                const tileDeleteButtonIcon = createElementWithAttributes("i", { 
                    classList: ["planner-tile-delete-button-icon", "fa-solid", "fa-ban"], 
                });
                tileDeleteButton.appendChild(tileDeleteButtonIcon);
                tileDeleteButton.addEventListener("click", () => {              
                    showLoading();
                    fetch(`/plannerMeal/${recipeId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(res => {
                        hideLoading();
                        return res.json()
                    })
                    .then(data => {
                        console.log('Success:', data);
                        console.log("carried over");
                        tileDeleteButton.remove();
                        clonedRecipe.remove();
                    })
                    .catch((error) => {
                        hideLoading();
                        console.error('Error:', error);
                    });
                });

                tile.appendChild(tileDeleteButton);
                tile.appendChild(clonedRecipe);

                // allow recently added recipe to show recipe info on click;
                clonedRecipe.style.cursor = "pointer";
                clonedRecipe.addEventListener("click", () => {
                    recipeInfoServingInput.value = Math.floor(receivedData.grams / 250);
                    populateRecipeInfoModal(receivedData);
                    recipeInfoModalPlanner.style.display = "block";
                })
                
                // use recipe data to delete from db
                let recipeData = {
                    recipe_id: recipeId,
                    day: recipeDay,
                    course: recipeCourse
                };

                showLoading();
                fetch('/plannerMeal', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(recipeData)
                })
                .then(res => {
                    hideLoading();
                    return res.json()
                })
                .then(data => {
                    console.log('Success:', data);
                    console.log("carried over")
                })
                .catch((error) => {
                    hideLoading();
                    console.error('Error:', error);
                });
            };
        });
    });
};

// RECIPE INFO MODAL CONTENT
// factory function to remove specific event listener
let currentFavouriteHandler = null;
const createFavouriteHandler = (recipe) => {
    return () => {
        console.log(recipe.id);
        recipeInfoStarIcon.classList.toggle("fa-regular");
        recipeInfoStarIcon.classList.toggle("fa-solid");
        recipeInfoStarIcon.classList.toggle("favourited");
        recipe.favourited = !recipe.favourited;
        updatedFavourited(recipe.id);  
        createMyRecipesGrid();
    };
};

const populateRecipeInfoModal = (recipe, isFavourited) => {
    // Modal for recipe specific info when clicking on a recipe
    recipeInfoIngredientsList.innerHTML = "";
    recipeInfoSource.innerHTML = "Source: ";

    recipeInfoName.textContent = recipe.name;
    recipeInfoCuisine.textContent = recipe.cuisine;
    recipeInfoCookingTime.textContent = "~" + recipe.cookingTime;
    
    recipeInfoKcal.textContent = recipe.calories;

    recipeInfoImage.src = recipe.imageURL || "https://www.och-lco.ca/wp-content/uploads/2015/07/unavailable-image.jpg";
    recipeInfoDirections.textContent = recipe.instructions;

    // Show favourite star in personal recipes, not while searching
    if (currentPage === "myRecipes") {
        // Handle star fill/colour inside recipe info modal
        if (isFavourited) {
            recipeInfoStarIcon.classList.add("favourited");
            recipeInfoStarIcon.classList.remove("fa-regular");
            recipeInfoStarIcon.classList.add("fa-solid");
        } else if (!isFavourited) {
            recipeInfoStarIcon.classList.remove("favourited");
            recipeInfoStarIcon.classList.add("fa-regular");
            recipeInfoStarIcon.classList.remove("fa-solid");
        };
    
        // Remove specific event listener if handler exists
        if (currentFavouriteHandler) {
            recipeInfoStarIcon.removeEventListener("click", currentFavouriteHandler);
        };
        // Create the handler
        currentFavouriteHandler = createFavouriteHandler(recipe);
        // Add new event listener
        recipeInfoStarIcon.addEventListener("click", currentFavouriteHandler);
    };

    // Add each ingredient with measurement amount to list
    recipe.ingredients.forEach(ingredients => {
        const recipeInfoIngredientsListItem = createElementWithAttributes("li", { 
            classList: ["recipe-info-ingredients-list-item"]
        });

        let measurement = "";
        let unit = "";
        
        // Allow changing serving amount to change ingredient amounts
        const adjustIngredientsAmountsByServings = () => {
            if (Number(ingredients.measurement.replace(/(\d+(\.\d+)?)(\s*\w*)*/, "$1"))) {
                unit = ingredients.measurement.replace(/^\d+(\.\d+)?\s*/, ' ');
                measurement = Number((Number(ingredients.measurement.replace(/(\d+(\.\d+)?)(\s*\w*)*/, "$1")) / Math.floor(recipe.grams / 250) * recipeInfoServingInput.value).toFixed(1));              
                // Round if greater than 10 to avoid weird numbers
                if (measurement > 10) {
                    measurement = Math.round(measurement);
                };
            } else {
                measurement = ingredients.measurement;
            };
        };

        adjustIngredientsAmountsByServings();

        // Create ingredients list contents with units and capitalised ingredients and append
        const recipeInfoIngredientsMeasurement = createElementWithAttributes("span", { 
            classList: ["recipe-info-ingredients-measurement"],
            textContent: measurement + unit + " "
        });
        const recipeInfoIngredientsIngredient = createElementWithAttributes("span", { 
            classList: ["recipe-info-ingredients-ingredient"],
            textContent: ingredients.ingredient.split(' ')
                                               .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                               .join(' ')
        });

        recipeInfoIngredientsListItem.appendChild(recipeInfoIngredientsMeasurement);
        recipeInfoIngredientsListItem.appendChild(recipeInfoIngredientsIngredient);

        recipeInfoIngredientsList.appendChild(recipeInfoIngredientsListItem);
    });
    
    // Create paragraphs in directions 
    if (/\s{2,}/g.test(recipe.instructions)) {
        recipeInfoDirections.innerHTML = recipe.instructions.replace(/\s{2,}/g, "<br><br>");
    };
    
    // If source isn't found return unknown
    if (recipe.source) {
        const recipeInfoLink = createElementWithAttributes("a", { 
            href: recipe.source,
            textContent: recipe.source,
            classList: ["recipe-info-source-link"]
        });
        recipeInfoSource.appendChild(recipeInfoLink);
    } else {
        recipeInfoSource.textContent = "Source: unknown"
    }; 
};

// ADD RECIPE MODAL CONTENT
const populateAddRecipeModal = () => {
    // Modal for adding a custom recipe
    let ingredientsArray = [];
    addRecipeIngredientsList.innerHTML = "";

    const addingIngredientsToList = () => {
        // Create list item
        const addRecipeIngredientsListItem = createElementWithAttributes("li", { 
            classList: ["add-recipe-modal-ingredients-list-item"]
        });

        // Create list contents and append
        const addRecipeIngredientsMeasurement = createElementWithAttributes("input", { 
            classList: ["add-recipe-modal-ingredients-measurement"],
            value: "",
            placeholder: "Qty"
        });
        const addRecipeIngredientsIngredient = createElementWithAttributes("input", { 
            classList: ["add-recipe-modal-ingredients-ingredient"],
            value: "",
            placeholder: "Ingredient"
        });
        const addRecipeIngredientsSaveIngredient = createElementWithAttributes("button", {
            classList: ["add-recipe-modal-ingredients-save-ingredient"],
            textContent: "+"
        })

        // Save/delete specific list item
        const handleListItem = () => {
            // Click button to save
            addRecipeIngredientsSaveIngredient.addEventListener("click", () => {
                saveAndDeleteListItem();
            });

            // Enter on measurement input to save
            addRecipeIngredientsMeasurement.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    saveAndDeleteListItem();
                };
            });

            // Enter on ingredients input to save
            addRecipeIngredientsIngredient.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    saveAndDeleteListItem();
                };
            });
            const saveAndDeleteListItem = () => {
                if (addRecipeIngredientsMeasurement.value === "" || addRecipeIngredientsIngredient.value === "") return;
                // Make previous elements unselectable
                addRecipeIngredientsMeasurement.style.backgroundColor = "transparent";
                addRecipeIngredientsMeasurement.setAttribute("readonly", true);
                addRecipeIngredientsMeasurement.classList.add("no-outline");
                addRecipeIngredientsIngredient.style.backgroundColor = "transparent";
                addRecipeIngredientsIngredient.setAttribute("readonly", true);
                addRecipeIngredientsIngredient.classList.add("no-outline");

                addRecipeIngredientsIngredient.value = addRecipeIngredientsIngredient.value.split(' ')
                                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                                    .join(' ')
    
                // Remove + button, add - button
                addRecipeIngredientsSaveIngredient.remove();
                const addRecipeIngredientsRemoveIngredient = createElementWithAttributes("button", {
                    classList: ["add-recipe-modal-ingredients-save-ingredient"],
                    textContent: "-"
                });
                addRecipeIngredientsListItem.appendChild(addRecipeIngredientsRemoveIngredient);

                // Find index to remove specific item
                addRecipeIngredientsRemoveIngredient.addEventListener("click", () => {
                    const index = ingredientsArray.findIndex(ingredient => 
                        ingredient.measurement === addRecipeIngredientsMeasurement.value &&
                        ingredient.ingredient === addRecipeIngredientsIngredient.value)
    
                    if (index > -1) {
                        ingredientsArray.splice(index, 1);
                    };
    
                    addRecipeIngredientsListItem.remove();
                    console.log(ingredientsArray)
                });
    
                // Push ingredients to array for later use
                ingredientsArray.push({
                    measurement: addRecipeIngredientsMeasurement.value,
                    ingredient: addRecipeIngredientsIngredient.value
                });
    
                console.log(ingredientsArray)
                
                // Add a new element
                addingIngredientsToList();
            };
        };
        handleListItem();

        // Combine elements
        addRecipeIngredientsListItem.appendChild(addRecipeIngredientsMeasurement);
        addRecipeIngredientsListItem.appendChild(addRecipeIngredientsIngredient);
        addRecipeIngredientsListItem.appendChild(addRecipeIngredientsSaveIngredient);

        addRecipeIngredientsList.appendChild(addRecipeIngredientsListItem);
    };
    addingIngredientsToList();
};

// EVENT LISTENERS
const homePageEventListeners = () => {
    const faqButton = document.querySelectorAll(".faq-button");

    faqButton.forEach(button => {
        button.addEventListener("click", (e) => {
            if (button.children[0].classList.contains("fa-angle-right")) {
                button.children[0].classList.remove("fa-angle-right");
                button.children[0].classList.add("fa-angle-down");
            } else if (button.children[0].classList.contains("fa-angle-down")) {
                button.children[0].classList.add("fa-angle-right");
                button.children[0].classList.remove("fa-angle-down");
            };

            const panel = e.target.nextElementSibling;

            if (panel.style.display === "none" || panel.style.display === "") {
                panel.style.display = "block";
            } else {
                panel.style.display = "none";
            };
        });
    });

    const newAccountBoxSignUp = document.getElementById("new-account-box-sign-up");
    newAccountBoxSignUp.addEventListener("click", () => {
        window.location.href = "register.html";
    });
};

const myRecipesEventListeners = () => {
    // layoutGrid.addEventListener("click", () => {
    //     setMyRecipesPageFormat("grid");
    //     getMyRecipesPageFormat();
    //     setMyRecipesLayout();
    // });

    // layoutList.addEventListener("click", () => {
    //     setMyRecipesPageFormat("list");
    //     getMyRecipesPageFormat();
    //     setMyRecipesLayout();
    // });

    const resetSelected = () => {
        if (selectToggled === true) {
            const recipeSelectedDivs = document.querySelectorAll(".recipe-selected-div");
            recipeSelectedDivs.forEach(div => {
                div.style.display = "none";
            });

            const recipeSelectedIcons = document.querySelectorAll(".fa-circle-check");
            recipeSelectedIcons.forEach(icon => {
                icon.style.display = "none";
            });

            const recipeContainers = document.querySelectorAll(".recipe-container");
            recipeContainers.forEach(container => {
                container.classList.remove("recipe-selected");
            });
            
            // reset selected recipes
            selectedRecipesArr = {
                meals: []
            };
        };
    };

    favouritesButton.addEventListener("click", () => {
        favouritesButton.classList.toggle("button-on");
        resetSelected();
        createMyRecipesGrid();
    });

    selectButton.addEventListener("click", () => {
        // hide visuals when select is toggled
        resetSelected();
        selectButton.classList.toggle("button-on");

        // show/hide delete selected recipes button
        deleteRecipesDiv.style.display = selectToggled === false ? "flex" : "none";
        deleteRecipesIcon.style.display = selectToggled === false ? "block" : "none";

        // change toggled status
        selectToggled = selectToggled === false ? true : false;
    });

    // click to delete multiple selected recipes
    deleteRecipesDiv.addEventListener("click", (e) => {
        selectedRecipesArr.meals.forEach(recipe => {
            deleteRecipe(recipe.id);
            console.log(selectedRecipesArr)
        });
        selectedRecipesArr = {
            meals: []
        };
    });
};

const plannerEventListeners = () => {
    // save the collapsed state to local storage
    let sidebarIsCollapsed = localStorage.getItem("planner-collapsed") || "uncollapsed";

    const collapsibleBar = document.getElementById("planner-collapsible-bar");
    const collapsibleBarIcon = document.getElementById("planner-collapsible-bar-icon");
    const recipesBar = document.getElementById("planner-recipes-bar");
    const plannerContent = document.getElementById("content-planner");

    if (sidebarIsCollapsed === "uncollapsed") {
        collapsibleBar.style.left = "210px";
        collapsibleBarIcon.style.left = "214px";
        plannerContent.style.marginLeft = "230px";
        plannerContent.style.paddingLeft = "0px";
        recipesBar.style.display = "block";
        collapsibleBarIcon.classList.remove("fa-angle-right");
        collapsibleBarIcon.classList.add("fa-angle-left");
    } else if (sidebarIsCollapsed === "collapsed") {
        collapsibleBar.style.left = "0px";
        collapsibleBarIcon.style.left = "4px";
        plannerContent.style.marginLeft = "0px";
        plannerContent.style.paddingLeft = "40px";
        recipesBar.style.display = "none";
        collapsibleBarIcon.classList.remove("fa-angle-left");
        collapsibleBarIcon.classList.add("fa-angle-right");
    };

    collapsibleBar.addEventListener("click", () => {
        if (sidebarIsCollapsed === "uncollapsed") {
            localStorage.setItem("planner-collapsed", "collapsed");
            sidebarIsCollapsed = "collapsed";
        } else if (sidebarIsCollapsed === "collapsed") {
            localStorage.setItem("planner-collapsed", "uncollapsed");
            sidebarIsCollapsed = "uncollapsed";
        };
        collapsibleBar.style.left = collapsibleBar.style.left === "210px" ? "0px" : "210px";
        collapsibleBarIcon.style.left = collapsibleBarIcon.style.left === "214px" ? "4px" : "214px";
        plannerContent.style.marginLeft = plannerContent.style.marginLeft === "230px" ? "0px" : "230px";
        plannerContent.style.paddingLeft = plannerContent.style.marginLeft === "230px" ? "0px" : "40px";

        recipesBar.style.display = recipesBar.style.display === "block" ? "none" : "block";

        if (collapsibleBarIcon.classList.contains("fa-angle-left")) {
            collapsibleBarIcon.classList.remove("fa-angle-left");
            collapsibleBarIcon.classList.add("fa-angle-right");
        } else if (collapsibleBarIcon.classList.contains("fa-angle-right")) {
            collapsibleBarIcon.classList.remove("fa-angle-right");
            collapsibleBarIcon.classList.add("fa-angle-left");
        };
    });
};

// MODAL EVENT LISTENERS
const addRecipeModalEventListeners = () => {
    const fileInput = document.getElementById("add-recipe-modal-image-input");
    const uploadButton = document.getElementById("add-recipe-modal-top-right-image-placeholder");

    const handleAddRecipeModalVisibility = () => {
        // Close modal when clicking outside
        window.addEventListener("click", (e) => {
            if (e.target === addRecipeModal) {
                addRecipeModal.style.display = "none";
            };
        });

        // Show modal on click 
        addRecipeButton.addEventListener("click", () => {
            addRecipeModal.style.display = "block";
            populateAddRecipeModal();
        });

        // Close modal with return header
        addRecipeHeaderClickbox.addEventListener("click", () => {
            addRecipeModal.style.display = "none";
        });
    };    
    
    // Resize textareas on overflow
    const allowTextareaResizing = () => {
        addRecipeTextareas.forEach(area => area.addEventListener('input', () => {
            area.style.height = 'auto';
            area.style.height = (area.scrollHeight) + 'px';
        }));

        addRecipeTextareas.forEach(area => area.style.height = (area.scrollHeight) + 'px');
    };
      
    // Preview image on click, add a placeholder by default
    const previewRecipeImage = () => {
        previewImageButton.addEventListener("click", () => {
            if (addRecipeImageURL.value === "") {
                handleImageHoverEffects(true);
            } else {
                handleImageHoverEffects(false);
                addRecipeImagePreview.src = addRecipeImageURL.value;
            };

            addRecipeImageContainer.addEventListener("mouseover", () => {
                if (addRecipeImageURL.value !== "") {
                    handleImageHoverEffects(true);
                };               
            });
        
            addRecipeImageContainer.addEventListener("mouseout", () => {
                if (addRecipeImageURL.value !== "") {
                    handleImageHoverEffects(false);
                };             
            });
        });
    };
    
    // Hover over the image to show upload button
    const handleImageHoverEffects = (show) => {
        addRecipePlaceholderImage.style.display = show ? "block" : "none";
        addRecipePlaceholderBackground.style.backgroundColor = show ? "var(--transparentred)" : "rgba(245, 245, 245, 0)";
    };

    // Allow uploading of image file
    const uploadRecipeImageFile = () => {
        uploadButton.addEventListener("click", () => {
            fileInput.click();
        });

        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            console.log(file)
            if (file) {
                addRecipeImagePreview.src = file.name;
                
                addRecipeImageURL.value = file.name;
                handleImageHoverEffects(false);

                addRecipeImageContainer.addEventListener("mouseover", () => {
                    handleImageHoverEffects(true);           
                });
            
                addRecipeImageContainer.addEventListener("mouseout", () => {
                    handleImageHoverEffects(false);                       
                });
            };
        });
    };

    // Make adding a recipe reset the values and sizes
    const resetAddRecipeModal = () => {
        addRecipeModalAddRecipeButton.addEventListener("click", () => {
            document.getElementById("add-recipe-modal-name").value = "";
            document.getElementById("add-recipe-modal-cuisine").value = "";
            document.getElementById("add-recipe-modal-time").value = "";
            document.getElementById("add-recipe-modal-source-url").value = "";
            document.getElementById("add-recipe-modal-image-url").value = "";
            document.getElementById("add-recipe-modal-top-right-image").src = "";
            addRecipeTextareas.forEach(area => area.style.height = 19 + 'px');
            handleImageHoverEffects(true);
    
            document.getElementById("add-recipe-modal-directions").value = "";
            populateAddRecipeModal();
            
        });
    };

    // POST recipe on click
    const postRecipeToDB = () => {
        addRecipeModalAddRecipeButton.addEventListener("click", () => {
            showLoading();
            const addRecipeName = document.getElementById("add-recipe-modal-name").value;
            const addRecipeCuisine = document.getElementById("add-recipe-modal-cuisine").value || "N/A";
            const addRecipeTime = document.getElementById("add-recipe-modal-time").value || "N/A";
            const addRecipeSourceUrl = document.getElementById("add-recipe-modal-source-url").value || "";
            const addRecipeImageUrl = document.getElementById("add-recipe-modal-image-url").value || "";

            const ingredients = [];
            const ingredientListItems = document.querySelectorAll('.add-recipe-modal-ingredients-list-item');
            ingredientListItems.forEach(item => {
                const ingredientElement = item.querySelector('.add-recipe-modal-ingredients-ingredient.no-outline');
                const measurementElement = item.querySelector('.add-recipe-modal-ingredients-measurement.no-outline');

                if (ingredientElement && measurementElement) {
                    const ingredient = ingredientElement.value;
                    const measurement = measurementElement.value;
                    ingredients.push({ ingredient, measurement });
                };
            });


            const convertIngredients = (ingredients) => {
        
                let convertedIngredients = [];
                let convertedIngredient;
                let totalGrams = 0;
                let totalCalories = 0;
        
                const convertIngredientWeights = (ingredient, quantity) => {
                    const normalisedIngredient = ingredient.toLowerCase().trim();
                    console.log(normalisedIngredient)
                    
                    let normalisedQuantity;
                    // console.log(quantity)
        
                    const convertFromKg = () => {
                        normalisedQuantity = quantity.replace(/(\d[.]\d)\s?kg/gi, "$1");
                        console.log("kg item")
        
                        totalGrams += 1 * normalisedQuantity * 1000;
                        totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 1000 / 100;
                        
                        return convertedIngredient = { 
                            grams: normalisedQuantity * 1000,
                            kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 1000 / 100,
                            unit: "kg"
                        };
                    };
        
                    const convertFromTsp = () => {
                        normalisedQuantity = quantity.replace(/(\d*)\s?(tb?l?sp?|tablespoons?|teaspoons?)(\s\w*)?/gi, "$1")
                        console.log("tsp item")
                        console.log(quantity)
                        console.log(normalisedQuantity)
        
                        totalGrams += 1 * normalisedQuantity * 6;
                        totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 6 / 100;
                        
                        return convertedIngredient = { 
                            grams: normalisedQuantity * 6,
                            kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 6 / 100,
                            unit: "tsp"
                        };
                    };
        
                    const convertFromGrams = () => {
                        normalisedQuantity = quantity.replace(/(\d+)\s?g(rams)?(\s?(\w*)?)*/gi, "$1");
                        
                        totalGrams += 1 * normalisedQuantity;
                        totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100;
                        
                        return convertedIngredient = { 
                            grams: normalisedQuantity ,
                            kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100,
                            unit: "g"
                        };
                    };
        
                    const convertFromOz = () => {
                        normalisedQuantity = quantity.replace(/(\d+)\s?oz(\s?(\w*)?)*/gi, "$1");
                        console.log("ounces")
                        console.log(normalisedQuantity)
                    
                        totalGrams += 1 * normalisedQuantity * 28.3495;
                        totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 28.3495 / 100;
                        
                        return convertedIngredient = { 
                            grams: normalisedQuantity * 28.3495,
                            kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 28.3495 / 100,
                            unit: "g"
                        };
                    };
        
                    const convertFromCups = () => {
                        console.log("trying to convert cups")
                        normalisedQuantity = convertCupsQuantityToNumber(quantity);
                        // console.log("cup item")
                        
        
                        totalGrams += 1 * normalisedQuantity * 250;
                        totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 250 / 100;
                        
                        return convertedIngredient = { 
                            grams: normalisedQuantity * 250,
                            kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * 250 / 100,
                            unit: /(\d)\scup/gi.test(quantity) ? " cup" : " cups"
                        };
                    };
        
                    const convertFromMl = () => {
                        normalisedQuantity = quantity.replace(/(\d+)ml/gi, "$1");
                        // console.log("ml item")
        
                        totalGrams += 1 * normalisedQuantity;
                        totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100;
        
                        return convertedIngredient = { 
                            grams: normalisedQuantity,
                            kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100,
                            unit: "ml"
                        };
                    };
        
                    const convertComplexDiscreteItems = () => {
                        normalisedQuantity = quantity.replace(/(\d*)\s(\w*)/gi, "$1");
                        // console.log("discrete item")
        
                        totalGrams += (ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity || 1);
                        totalCalories += (ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100)) || 1;
                        
                        return convertedIngredient = { 
                            grams: (ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity) || 1,
                            kcal: (ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100)) || 1,
                            unit: "g"
                        };
                    };
        
                    const convertSimpleDiscreteItems = () => {
                        normalisedQuantity = quantity.replace(/(\d*)\s(\w*)/gi, "$1");
                        // console.log("discrete item 2")
        
                        totalGrams += (ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity) || 1;
                        totalCalories += (ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100)) || 1;
                        
                        return convertedIngredient = { 
                            grams: (ingredientWeights[normalisedIngredient].discreteWeight * normalisedQuantity) || 1,
                            kcal: (ingredientWeights[normalisedIngredient].kcal * normalisedQuantity * (ingredientWeights[normalisedIngredient].discreteWeight / 100)) || 1,
                            unit: "g"
                        };
                    };
        
                    console.log(quantity)
                    switch(true) {
                        case /^[^\d]*$/.test(quantity):
                            return convertedIngredient = ingredientWeights[normalisedIngredient] * normalisedQuantity;
                        // convert kg
                        case /(\d[.]\d)\s?kg/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertFromKg();
                        // convert tsp
                        case /(\d*)\s?(tb?sp?|tablespoons?|teaspoons?)/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertFromTsp();
                        // convert grams
                        case /(\d+)\s?g(rams)?/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertFromGrams();
                        // convert oz
                        case /(\d+)\s?oz/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertFromOz();
                        // convert cups
                        case /(\d+\s?\d*\/?\d*|½|¼|¾)\s*cups?/i.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertFromCups();
                        // convert ml
                        case /(\d+)ml/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertFromMl();
                        // convert lbs
                        // case /(\d+)lb/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                        //     normalisedQuantity = quantity.replace(/(\d+)lb/gi, "$1");
                        //     console.log("ml item")
        
                        //     totalGrams += ingredientWeights[normalisedIngredient].weight * normalisedQuantity;
                        //     totalCalories += ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100;
        
                        //     return convertedIngredient = { 
                        //         grams: ingredientWeights[normalisedIngredient].weight * normalisedQuantity,
                        //         kcal: ingredientWeights[normalisedIngredient].kcal * normalisedQuantity / 100,
                        //         unit: "ml"
                        //     };
                        // convert discrete items (12 chicken thighs)
                        case /^\d+\s(?!cup|cups\b).+$/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertComplexDiscreteItems();
                            // convert discrete items with no extra words (2 green chilli)
                        case /(\d*)(\s(\w*))*/gi.test(quantity) && ingredientWeights[normalisedIngredient] !== undefined:
                            return convertSimpleDiscreteItems();
        
                        default:
                            return convertedIngredient = ingredientWeights[normalisedIngredient] * normalisedQuantity;
                    };
                };
        
                ingredients.forEach(ingredients => {         
                        convertIngredientWeights(ingredients.ingredient, ingredients.measurement);
                        
                    // if (!convertedIngredient) {
                    //     convertedIngredient = {
                    //         grams: 1,
                    //         kcal: 1, 
                    //         unit: 'g'
                    //     };
                    // };
                    console.log(convertedIngredient)
                                   
                    if (convertedIngredient) {
                        convertedIngredients.push({
                            ingredient: ingredients.ingredient,
                            measurement: convertedIngredient.grams + "g",             
                            calories: convertedIngredient.kcal + " calories"
                        });
                    } else {
                        convertedIngredients.push({
                            ingredient: ingredients.ingredient,
                            measurement: ingredients.measurement,
                            calories: 0
                        });
                    };
                });
        
                // console.log(convertedIngredients)
                console.log(totalGrams + " grams")
                // console.log(totalCalories + " calories")
                return { convertedIngredients, totalCalories, totalGrams }
            };
        
            totalGrams = (convertIngredients(ingredients).totalGrams) || 1;
            totalCalories = Math.round(convertIngredients(ingredients).totalCalories / (totalGrams / 100)) || 1;

            const addRecipeInstructions = document.getElementById("add-recipe-modal-directions").value || "";

            const recipeData = {
                name: addRecipeName,
                cuisine: addRecipeCuisine,
                cookingTime: addRecipeTime,
                source: addRecipeSourceUrl,
                imageURL: addRecipeImageUrl,
                ingredients: ingredients,
                instructions: addRecipeInstructions,
                calories: totalCalories,
                grams: totalGrams,
                favourited: false
            };

            console.log(recipeData)
            fetch('/recipe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(recipeData)
            })
            .then(res => {
                hideLoading();
                return res.json()
            })
            .then(data => {
                console.log('Success:', data);
                console.log("carried over")
                console.log(recipeData)
                console.log(data.recipe._id)
                const newRecipe = new AddRecipe(recipeData, data.recipe._id);
                console.log("new recipe")
                console.log(newRecipe)
                myRecipesArr.meals.push(newRecipe);
                console.log(myRecipesArr)
                createMyRecipesGrid();
                populateMyRecipesFilterLists();
            })
            .catch((error) => {
                hideLoading();
                console.error('Error:', error);
            });
        });
    };

    handleAddRecipeModalVisibility();
    allowTextareaResizing();
    previewRecipeImage();
    postRecipeToDB();
    resetAddRecipeModal();
    uploadRecipeImageFile(); 
};

const recipeInfoModalEventListeners = (recipe) => {
    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
        if (e.target === recipeInfoModal) {
            recipeInfoModal.style.display = "none";
            if (currentPage === "myRecipes") {
                createMyRecipesGrid();
            } else if (currentPage === "findRecipes") {
                createFindRecipesGrid();
            };     
        };
    });

    // Close modal with return header
    recipeInfoHeaderClickbox.addEventListener("click", () => {
        recipeInfoModal.style.display = "none";
        if (currentPage === "myRecipes") {
            createMyRecipesGrid();
        } else if (currentPage === "findRecipes") {
            createFindRecipesGrid();
        };  
    });

    window.addEventListener("click", (e) => {
        if (e.target === recipeInfoModalPlanner) {
            recipeInfoModalPlanner.style.display = "none";
        };
    });

    // Close modal with return header
    recipeInfoHeaderClickbox.addEventListener("click", () => {
        recipeInfoModalPlanner.style.display = "none";
    });
};

// COLOUR THEME
const colourSchemeEventListener = () => {
    // load local storage theme
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const colourSchemeButton = document.getElementById("colour-scheme-button");
    const colourSchemeModal = document.getElementById("colour-scheme-modal");
    const colourSchemeIcon = document.getElementById("colour-scheme-icon");
    colourSchemeModal.style.opacity = "0";
    colourSchemeModal.style.pointerEvents = "none";

    // close modal after clicking off
    window.addEventListener("click", (e) => {
        if (!colourSchemeModal.contains(e.target) && e.target !== colourSchemeButton && e.target !== colourSchemeIcon) {
            colourSchemeModal.style.opacity = "0";
            colourSchemeModal.style.pointerEvents = "none";
            colourSchemeButton.style.backgroundColor = colourSchemeModal.style.opacity === "1" ? "var(--active-colour)" : "var(--dropdown-colour)"
        };
    });

    // toggle modal display
    colourSchemeButton.addEventListener("click", () => {
        colourSchemeModal.style.opacity = colourSchemeModal.style.opacity === "0" ? "1" : "0";
        colourSchemeModal.style.pointerEvents = colourSchemeModal.style.pointerEvents === "none" ? "auto" : "none";
        colourSchemeButton.style.backgroundColor = colourSchemeModal.style.opacity === "1" ? "var(--active-colour)" : "var(--dropdown-colour)"
    });

    // save current theme
    const darkTile = document.getElementById("dark-tile");
    const lightTile = document.getElementById("light-tile");  
    const purpleTile = document.getElementById("purple-tile");
    const redTile = document.getElementById("red-tile");
    const pinkTile = document.getElementById("pink-tile");
    const tealTile = document.getElementById("teal-tile");

    darkTile.addEventListener("click", () => {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
    });

    lightTile.addEventListener("click", () => {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
    });

    purpleTile.addEventListener("click", () => {
        document.documentElement.setAttribute("data-theme", "purple");
        localStorage.setItem("theme", "purple");
    });

    redTile.addEventListener("click", () => {
        document.documentElement.setAttribute("data-theme", "red");
        localStorage.setItem("theme", "red");
    });

    pinkTile.addEventListener("click", () => {
        document.documentElement.setAttribute("data-theme", "pink");
        localStorage.setItem("theme", "pink");
    });

    tealTile.addEventListener("click", () => {
        document.documentElement.setAttribute("data-theme", "teal");
        localStorage.setItem("theme", "teal");
    });

};

// Init
const initialisePages = () => {
    // initialise colour scheme
    colourSchemeEventListener();
    
    // handle each page
    if (window.location.pathname === '/public/home.html' || window.location.pathname === '/' || window.location.pathname === '/home.html') {
        document.addEventListener("DOMContentLoaded", () => {
            currentPage = "home";
            homePageEventListeners();
        });
    };

    if (window.location.pathname === '/public/myrecipes.html' || window.location.pathname === '/myrecipes.html') {
        document.addEventListener("DOMContentLoaded", () => {
            currentPage = "myRecipes";
            // Get and show recipes
            getUserRecipes();
            document.getElementById("navbar-my-recipes").style.backgroundColor = "var(--active-colour)";
            addRecipeModal.style.display = "none";
            addRecipeModalEventListeners();
            recipeInfoModal.style.display = "none";
            recipeInfoModalEventListeners();
            myRecipesEventListeners();
            myRecipesFilterEventListeners();
            // getMyRecipesPageFormat();
            // setMyRecipesLayout();
        });
    };
    
    if (window.location.pathname === '/public/findrecipes.html' || window.location.pathname === '/findrecipes.html') {
        document.addEventListener("DOMContentLoaded", () => {
            currentPage = "findRecipes";
            document.getElementById("navbar-find-recipes").style.backgroundColor = "var(--active-colour)";
            getFindRecipes();
            recipeInfoModal.style.display = "none";
            recipeInfoModalEventListeners();
            populateFindRecipesFilterLists();
        });
    };

    if (window.location.pathname === '/public/planner.html' || window.location.pathname === '/planner.html') {
        document.addEventListener("DOMContentLoaded", () => {
            currentPage = "planner";
            document.getElementById("navbar-planner").style.backgroundColor = "var(--active-colour)";
            // plannerRecipesModalEventListeners();
            populatePlannerRecipesBar();
            plannerEventListeners();
            recipeInfoModalPlanner.style.display = "none";
            recipeInfoModalEventListeners();
        });
    };
    
    // if (window.location.pathname === '/public/shoppinglist.html' || window.location.pathname === '/shoppinglist.html') {
    //     document.addEventListener("DOMContentLoaded", () => {
    //         document.getElementById("navbar-shopping-list").style.backgroundColor = "var(--active-colour)";
    //     });
    // };
};

const apiKey = "1";
// let layout = "grid";
let selectToggled = false;
let selectedRecipesArr = {
    meals: []
};
let currentPage = "";

// My Recipes elements
const myRecipesLayout = document.getElementById("my-recipes-layout");
const layoutGrid = document.getElementById("layout-grid");
const layoutList = document.getElementById("layout-list");

// Navbar elements
const favouritesButton = document.getElementById("favourites-only-button");
const selectButton = document.getElementById("select-button");
const deleteRecipesDiv = document.getElementById("delete-recipes-div");
const deleteRecipesIcon = document.getElementById("delete-recipes-icon");

// Add recipe modal elements
const addRecipeButton = document.getElementById("add-recipe-button");
const addRecipeModal = document.getElementById("add-recipe-modal");
const addRecipeHeaderClickbox = document.getElementById("add-recipe-modal-header-clickbox");

const addRecipeIngredientsList = document.getElementById("add-recipe-modal-ingredients-list");
const addRecipeModalAddRecipeButton = document.getElementById("add-recipe-modal-add-recipe-button");

const addRecipeTextareas = document.querySelectorAll(".add-recipe-modal-text");

const previewImageButton = document.getElementById("add-recipe-modal-preview-image-button");
const addRecipeImageURL = document.getElementById("add-recipe-modal-image-url");
const addRecipeImageContainer = document.getElementById("add-recipe-modal-top-right-image-container");
const addRecipePlaceholderImage = document.getElementById("add-recipe-modal-top-right-image-placeholder");
const addRecipePlaceholderBackground = document.getElementById("add-recipe-modal-top-right-background");
const addRecipeImagePreview = document.getElementById("add-recipe-modal-top-right-image");

// Recipe info modal elements
const recipeInfoModal = document.getElementById("recipe-info-modal");
const recipeInfoModalPlanner = document.getElementById("recipe-info-modal-plannerver");
const recipeInfoHeaderClickbox = document.getElementById("recipe-info-header-clickbox");

const recipeInfoName = document.getElementById("recipe-info-name");
const recipeInfoStarIcon = document.querySelector(".recipe-info-star-icon");
const recipeInfoCuisine = document.getElementById("recipe-info-cuisine");
const recipeInfoCookingTime = document.getElementById("recipe-info-cooking-time");
const recipeInfoImage = document.getElementById("recipe-info-top-right-image");
const recipeInfoIngredientsList = document.getElementById("recipe-info-ingredients-list");
const recipeInfoDirections = document.getElementById("recipe-info-directions");
const recipeInfoSource = document.getElementById("recipe-info-source");

// Planner recipe modal elements
const plannerRecipesModal = document.getElementById("planner-recipes-modal");
const plannerTiles = document.querySelectorAll(".planner-tile");

// Nutritional info elements
const recipeInfoKcal = document.getElementById("recipe-info-kcal");
const recipeInfoServingInput = document.getElementById("recipe-info-serving-input");

// Test
const testRecipe = document.getElementById("test-recipe");
const testRecipeAPI = document.getElementById("test-recipe-api");

initialisePages();
