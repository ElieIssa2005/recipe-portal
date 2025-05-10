// Main app initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (Auth.isAuthenticated()) {
        showApp();
    } else {
        showLogin();
    }

    // Set up event listeners
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // Login form submission
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', handleLogin);

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', handleLogout);

    // Menu navigation
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.dataset.view;

            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');

            // Load the selected view
            loadView(viewName);
        });
    });

    // Recipe form submission
    const recipeForm = document.getElementById('recipe-form');
    recipeForm.addEventListener('submit', handleRecipeSubmit);

    // Search form submission
    const searchForm = document.getElementById('search-form');
    searchForm.addEventListener('submit', handleSearch);

    // Add recipe buttons
    document.getElementById('add-recipe-btn').addEventListener('click', () => showRecipeForm());
    document.getElementById('add-my-recipe-btn').addEventListener('click', () => showRecipeForm());

    // Modal close buttons
    const closeModalButtons = document.querySelectorAll('.close-modal, .cancel-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            hideModal(modal);
        });
    });

    // Close modal when clicking outside content
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', event => {
            if (event.target === modal) {
                hideModal(modal);
            }
        });
    });
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('login-error');

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        errorMessage.textContent = 'Please enter both username and password';
        errorMessage.style.display = 'block';
        return;
    }

    try {
        // Attempt login
        await Auth.login(username, password);

        // Clear form
        usernameInput.value = '';
        passwordInput.value = '';
        errorMessage.style.display = 'none';

        // Show main app
        showApp();
    } catch (error) {
        // Display error message
        errorMessage.textContent = error.message || 'Login failed. Please check your credentials.';
        errorMessage.style.display = 'block';
    }
}

// Handle logout
function handleLogout() {
    Auth.logout();
    showLogin();
}

// Show login screen
function showLogin() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('app-section').classList.add('hidden');
}

// Show main application
function showApp() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');

    // Set username display
    document.getElementById('username-display').textContent = Auth.username;

    // Show admin menu if user has admin role
    if (Auth.hasRole('ROLE_ADMIN')) {
        document.getElementById('admin-menu-item').style.display = 'flex';
    } else {
        document.getElementById('admin-menu-item').style.display = 'none';
    }

    // Load dashboard by default
    document.querySelector('.menu-item[data-view="dashboard"]').classList.add('active');
    loadView('dashboard');
}

// Load specified view
async function loadView(viewName) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show selected view
    const viewSection = document.getElementById(`${viewName}-view`);
    viewSection.classList.remove('hidden');

    try {
        switch (viewName) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'all-recipes':
                await loadAllRecipes();
                break;
            case 'my-recipes':
                await loadMyRecipes();
                break;
            case 'search-recipes':
                await loadSearchView();
                break;
            case 'admin':
                await loadAdminView();
                break;
        }
    } catch (error) {
        showNotification(`Error loading ${viewName}: ${error.message}`, 'error');
    }
}

// Load dashboard view
async function loadDashboard() {
    try {
        // Load stats
        const stats = await Promise.all([
            Recipes.getAllRecipes(),
            Recipes.getMyRecipes(),
            Recipes.getCategories()
        ]);

        // Update stat cards
        document.getElementById('total-recipes').textContent = stats[0].length;
        document.getElementById('my-recipes-count').textContent = stats[1].length;
        document.getElementById('categories-count').textContent = stats[2].length;

        // Show recent recipes
        const recentRecipesList = document.getElementById('recent-recipes-list');
        recentRecipesList.innerHTML = '';

        const recentRecipes = [...stats[0]].sort((a, b) => {
            // Sort by ID in descending order (assuming newer recipes have higher IDs)
            // This is a simplification; in a real app, you'd sort by date
            return b.id.localeCompare(a.id);
        }).slice(0, 5);

        if (recentRecipes.length > 0) {
            recentRecipes.forEach(recipe => {
                recentRecipesList.appendChild(RecipeUI.renderRecipeListItem(recipe));
            });
        } else {
            recentRecipesList.innerHTML = '<p>No recipes found</p>';
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        throw error;
    }
}

// Load all recipes view
async function loadAllRecipes() {
    try {
        const recipesList = document.getElementById('all-recipes-list');
        recipesList.innerHTML = '<div class="loading">Loading recipes...</div>';

        const recipes = await Recipes.getAllRecipes();

        recipesList.innerHTML = '';

        if (recipes.length > 0) {
            recipes.forEach(recipe => {
                recipesList.appendChild(RecipeUI.renderRecipeCard(recipe));
            });
        } else {
            recipesList.innerHTML = '<p>No recipes found</p>';
        }
    } catch (error) {
        console.error('Error loading all recipes:', error);
        throw error;
    }
}

// Load my recipes view
async function loadMyRecipes() {
    try {
        const recipesList = document.getElementById('my-recipes-list');
        recipesList.innerHTML = '<div class="loading">Loading your recipes...</div>';

        const recipes = await Recipes.getMyRecipes();

        recipesList.innerHTML = '';

        if (recipes.length > 0) {
            recipes.forEach(recipe => {
                recipesList.appendChild(RecipeUI.renderRecipeCard(recipe));
            });
        } else {
            recipesList.innerHTML = '<p>You haven\'t created any recipes yet</p>';
        }
    } catch (error) {
        console.error('Error loading my recipes:', error);
        throw error;
    }
}

// Load search view
async function loadSearchView() {
    try {
        const categorySelect = document.getElementById('search-category');

        // Clear existing options and populate categories
        categorySelect.innerHTML = '<option value="">Any category</option>';

        // Get categories if not already loaded
        if (Recipes.categories.length === 0) {
            await Recipes.getCategories();
        }

        // Add category options
        Recipes.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categorySelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading search view:', error);
        throw error;
    }
}

// Load admin view
async function loadAdminView() {
    if (!Auth.hasRole('ROLE_ADMIN')) {
        // Redirect to dashboard if not admin
        document.querySelector('.menu-item[data-view="dashboard"]').click();
        showNotification('You do not have permission to access the admin area', 'error');
        return;
    }

    try {
        // Load stats
        const stats = await Promise.all([
            Recipes.getAllRecipes(),
            Recipes.getCategories()
        ]);

        // Update stat cards
        document.getElementById('admin-total-recipes').textContent = stats[0].length;
        document.getElementById('admin-categories').textContent = stats[1].length;

    } catch (error) {
        console.error('Error loading admin view:', error);
        throw error;
    }
}

// Handle recipe form submission
async function handleRecipeSubmit(event) {
    event.preventDefault();

    // Get form data
    const form = event.target;
    const idInput = form.querySelector('#recipe-id');
    const titleInput = form.querySelector('#recipe-title');
    const categorySelect = form.querySelector('#recipe-category');
    const cookingTimeInput = form.querySelector('#recipe-cooking-time');
    const ingredientsTextarea = form.querySelector('#recipe-ingredients');
    const instructionsTextarea = form.querySelector('#recipe-instructions');

    // Validate inputs
    if (!titleInput.value.trim() || !categorySelect.value || !cookingTimeInput.value ||
        !ingredientsTextarea.value.trim() || !instructionsTextarea.value.trim()) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Create recipe object
    const recipe = {
        title: titleInput.value.trim(),
        category: categorySelect.value,
        cookingTime: parseInt(cookingTimeInput.value),
        ingredients: ingredientsTextarea.value.split('\n')
            .map(ingredient => ingredient.trim())
            .filter(ingredient => ingredient),
        instructions: instructionsTextarea.value.trim()
    };

    try {
        // Determine if creating or updating
        const isUpdating = idInput.value !== '';

        // Call API
        if (isUpdating) {
            recipe.id = idInput.value;
            await Recipes.updateRecipe(idInput.value, recipe);
            showNotification('Recipe updated successfully', 'success');
        } else {
            await Recipes.createRecipe(recipe);
            showNotification('Recipe created successfully', 'success');
        }

        // Hide modal
        hideModal(document.getElementById('recipe-form-modal'));

        // Reload current view
        const activeView = document.querySelector('.menu-item.active').dataset.view;
        loadView(activeView);

    } catch (error) {
        showNotification(`Error saving recipe: ${error.message}`, 'error');
    }
}

// Handle search form submission
async function handleSearch(event) {
    event.preventDefault();

    // Get form data
    const form = event.target;
    const title = form.querySelector('#search-title').value.trim();
    const category = form.querySelector('#search-category').value;
    const cookingTime = form.querySelector('#search-cooking-time').value;
    const ingredient = form.querySelector('#search-ingredient').value.trim();

    // Build search criteria
    const criteria = {};
    if (title) criteria.title = title;
    if (category) criteria.category = category;
    if (cookingTime) criteria.maxCookingTime = parseInt(cookingTime);
    if (ingredient) criteria.ingredient = ingredient;

    // Check if any criteria are provided
    if (Object.keys(criteria).length === 0) {
        showNotification('Please enter at least one search criterion', 'warning');
        return;
    }

    try {
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '<div class="loading">Searching recipes...</div>';

        // Perform search
        const results = await Recipes.searchRecipes(criteria);

        // Display results
        resultsContainer.innerHTML = '';

        if (results.length > 0) {
            results.forEach(recipe => {
                resultsContainer.appendChild(RecipeUI.renderRecipeCard(recipe));
            });
        } else {
            resultsContainer.innerHTML = '<p>No recipes found matching your criteria</p>';
        }
    } catch (error) {
        console.error('Error searching recipes:', error);
        showNotification(`Error searching recipes: ${error.message}`, 'error');
    }
}