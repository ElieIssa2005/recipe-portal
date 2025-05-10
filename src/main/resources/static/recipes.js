// Recipe management module
const Recipes = {
    // Store for loaded recipes
    allRecipes: [],
    myRecipes: [],
    categories: [],

    // Load all recipes
    async getAllRecipes() {
        try {
            this.allRecipes = await apiRequest('/api/recipes');
            return this.allRecipes;
        } catch (error) {
            console.error('Error loading recipes:', error);
            throw error;
        }
    },

    // Load my recipes
    async getMyRecipes() {
        try {
            this.myRecipes = await apiRequest('/api/recipes/my-recipes');
            return this.myRecipes;
        } catch (error) {
            console.error('Error loading my recipes:', error);
            throw error;
        }
    },

    // Load categories
    async getCategories() {
        try {
            this.categories = await apiRequest('/api/recipes/categories');
            return this.categories;
        } catch (error) {
            console.error('Error loading categories:', error);
            throw error;
        }
    },

    // Get recipe by ID
    async getRecipeById(id) {
        try {
            return await apiRequest(`/api/recipes/${id}`);
        } catch (error) {
            console.error(`Error loading recipe ${id}:`, error);
            throw error;
        }
    },

    // Create new recipe
    async createRecipe(recipe) {
        try {
            return await apiRequest('/api/recipes', 'POST', recipe);
        } catch (error) {
            console.error('Error creating recipe:', error);
            throw error;
        }
    },

    // Update recipe
    async updateRecipe(id, recipe) {
        try {
            return await apiRequest(`/api/recipes/${id}`, 'PUT', recipe);
        } catch (error) {
            console.error(`Error updating recipe ${id}:`, error);
            throw error;
        }
    },

    // Delete recipe
    async deleteRecipe(id) {
        try {
            await apiRequest(`/api/recipes/${id}`, 'DELETE');
            return true;
        } catch (error) {
            console.error(`Error deleting recipe ${id}:`, error);
            throw error;
        }
    },

    // Search recipes
    async searchRecipes(criteria) {
        // Build query string
        const params = new URLSearchParams();

        if (criteria.title) params.append('title', criteria.title);
        if (criteria.category) params.append('category', criteria.category);
        if (criteria.maxCookingTime) params.append('maxCookingTime', criteria.maxCookingTime);
        if (criteria.ingredient) params.append('ingredient', criteria.ingredient);

        try {
            return await apiRequest(`/api/recipes/search/advanced?${params.toString()}`);
        } catch (error) {
            console.error('Error searching recipes:', error);
            throw error;
        }
    }
};

// UI Helper functions for recipes
const RecipeUI = {
    // Render recipe card
    renderRecipeCard(recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.dataset.id = recipe.id;

        card.innerHTML = `
            <div class="recipe-card-header">
                <h3>${recipe.title}</h3>
            </div>
            <div class="recipe-card-body">
                <div class="recipe-card-info">
                    <span><i class="fas fa-layer-group"></i> ${recipe.category}</span>
                    <span><i class="fas fa-clock"></i> ${recipe.cookingTime} minutes</span>
                    <span><i class="fas fa-user"></i> ${recipe.createdBy}</span>
                </div>
                <div class="recipe-card-description">
                    ${recipe.ingredients.slice(0, 3).map(ingredient => `<span>${ingredient}</span>`).join(', ')}
                    ${recipe.ingredients.length > 3 ? '...' : ''}
                </div>
                <div class="recipe-card-actions">
                    <button class="btn btn-primary btn-small view-recipe-btn">View</button>
                    ${recipe.createdBy === Auth.username || Auth.hasRole('ROLE_ADMIN') ?
            `<div>
                            <button class="btn btn-secondary btn-small edit-recipe-btn">Edit</button>
                            <button class="btn btn-danger btn-small delete-recipe-btn">Delete</button>
                        </div>` : ''}
                </div>
            </div>
        `;

        // Add event listeners
        card.querySelector('.view-recipe-btn').addEventListener('click', () => {
            showRecipeDetails(recipe);
        });

        const editBtn = card.querySelector('.edit-recipe-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showRecipeForm(recipe);
            });
        }

        const deleteBtn = card.querySelector('.delete-recipe-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showDeleteConfirmation(recipe);
            });
        }

        return card;
    },

    // Render recipe list item (for dashboard)
    renderRecipeListItem(recipe) {
        const item = document.createElement('div');
        item.className = 'recipe-item';
        item.dataset.id = recipe.id;

        item.innerHTML = `
            <h4>${recipe.title}</h4>
            <div class="recipe-meta">
                <span>${recipe.category}</span>
                <span>${recipe.cookingTime} min</span>
            </div>
        `;

        item.addEventListener('click', () => {
            showRecipeDetails(recipe);
        });

        return item;
    },

    // Render recipe details in modal
    renderRecipeDetails(modal, recipe) {
        // Set recipe title
        const titleElement = modal.querySelector('#modal-recipe-title');
        titleElement.textContent = recipe.title;

        // Set recipe info
        modal.querySelector('#modal-recipe-category').textContent = recipe.category;
        modal.querySelector('#modal-recipe-time').textContent = recipe.cookingTime;
        modal.querySelector('#modal-recipe-author').textContent = recipe.createdBy;

        // Set ingredients
        const ingredientsList = modal.querySelector('#modal-recipe-ingredients');
        ingredientsList.innerHTML = '';
        recipe.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.textContent = ingredient;
            ingredientsList.appendChild(li);
        });

        // Set instructions
        modal.querySelector('#modal-recipe-instructions').textContent = recipe.instructions;

        // Set actions
        const actionsContainer = modal.querySelector('#recipe-actions');
        actionsContainer.innerHTML = '';

        // Add edit/delete buttons if user is authorized
        if (recipe.createdBy === Auth.username || Auth.hasRole('ROLE_ADMIN')) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-secondary';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => {
                hideModal(modal);
                showRecipeForm(recipe);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                hideModal(modal);
                showDeleteConfirmation(recipe);
            });

            actionsContainer.appendChild(editBtn);
            actionsContainer.appendChild(deleteBtn);
        }
    },

    // Populate recipe form
    populateRecipeForm(form, recipe = null) {
        const titleInput = form.querySelector('#recipe-title');
        const categorySelect = form.querySelector('#recipe-category');
        const cookingTimeInput = form.querySelector('#recipe-cooking-time');
        const ingredientsTextarea = form.querySelector('#recipe-ingredients');
        const instructionsTextarea = form.querySelector('#recipe-instructions');
        const idInput = form.querySelector('#recipe-id');

        // Clear existing values
        titleInput.value = '';
        cookingTimeInput.value = '';
        ingredientsTextarea.value = '';
        instructionsTextarea.value = '';
        idInput.value = '';

        // Populate categories dropdown
        this.populateCategoriesDropdown(categorySelect);

        // If editing an existing recipe
        if (recipe) {
            form.querySelector('#recipe-form-title').textContent = 'Edit Recipe';
            titleInput.value = recipe.title;
            cookingTimeInput.value = recipe.cookingTime;
            ingredientsTextarea.value = recipe.ingredients.join('\n');
            instructionsTextarea.value = recipe.instructions;
            idInput.value = recipe.id;

            // Set category once options are loaded
            setTimeout(() => {
                categorySelect.value = recipe.category;
            }, 100);
        } else {
            form.querySelector('#recipe-form-title').textContent = 'Add New Recipe';
        }
    },

    // Populate categories dropdown
    async populateCategoriesDropdown(selectElement) {
        try {
            // Keep the first option
            const defaultOption = selectElement.options[0];
            selectElement.innerHTML = '';
            selectElement.appendChild(defaultOption);

            // Get categories if not already loaded
            if (Recipes.categories.length === 0) {
                await Recipes.getCategories();
            }

            // Add options for each category
            Recipes.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                selectElement.appendChild(option);
            });

            // Add "Other" option to create new category
            const otherOption = document.createElement('option');
            otherOption.value = "other";
            otherOption.textContent = "Other (Create new)";
            selectElement.appendChild(otherOption);

            // Event listener for "other" option
            selectElement.addEventListener('change', function() {
                if (this.value === 'other') {
                    const newCategory = prompt('Enter new category name:');
                    if (newCategory && newCategory.trim()) {
                        // Create new option
                        const newOption = document.createElement('option');
                        newOption.value = newCategory.trim().toLowerCase();
                        newOption.textContent = newCategory.trim();

                        // Add before "Other" option
                        selectElement.insertBefore(newOption, otherOption);

                        // Select new option
                        selectElement.value = newOption.value;
                    } else {
                        // Reset to default if canceled
                        selectElement.value = '';
                    }
                }
            });
        } catch (error) {
            console.error('Error populating categories dropdown:', error);
        }
    }
};

// Modal helper functions
function showModal(modalElement) {
    modalElement.style.display = 'block';
}

function hideModal(modalElement) {
    modalElement.style.display = 'none';
}

// Show recipe details in modal
function showRecipeDetails(recipe) {
    const modal = document.getElementById('recipe-detail-modal');
    RecipeUI.renderRecipeDetails(modal, recipe);
    showModal(modal);
}

// Show recipe form for create/edit
function showRecipeForm(recipe = null) {
    const modal = document.getElementById('recipe-form-modal');
    const form = modal.querySelector('#recipe-form');

    RecipeUI.populateRecipeForm(form, recipe);
    showModal(modal);
}

// Show delete confirmation
function showDeleteConfirmation(recipe) {
    const modal = document.getElementById('confirm-delete-modal');
    const confirmBtn = modal.querySelector('#confirm-delete-btn');

    // Set up confirmation button
    confirmBtn.onclick = async () => {
        try {
            await Recipes.deleteRecipe(recipe.id);
            hideModal(modal);

            // Reload current view
            const activeView = document.querySelector('.menu-item.active').dataset.view;
            loadView(activeView);

            showNotification('Recipe deleted successfully', 'success');
        } catch (error) {
            showNotification(`Error deleting recipe: ${error.message}`, 'error');
        }
    };

    showModal(modal);
}

// Show notification message
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);

        // Add styles
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '1000';
        notification.style.maxWidth = '300px';
        notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    }

    // Set notification type styles
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#1cc88a';
            notification.style.color = 'white';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74a3b';
            notification.style.color = 'white';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f6c23e';
            notification.style.color = 'white';
            break;
        default:
            notification.style.backgroundColor = '#4e73df';
            notification.style.color = 'white';
    }

    // Set message and show
    notification.textContent = message;
    notification.style.display = 'block';

    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}