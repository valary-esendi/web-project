// Registration handler
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullname = document.getElementById('full_name').value;
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const response = await fetch('http://localhost:4000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name: fullname, email, username, password }),
        });

        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            window.location.href = 'login.html';  // Redirect to login
        } else {
            alert(data.message);
        }
    });
});

// Login handler
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const response = await fetch('http://localhost:4000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.userId);
            window.location.href = 'meals.html';  // Redirect to meals page
        } else {
            alert(data.message);
        }
    });
});

// Handle logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = 'login.html';  // Redirect to login
}

// Meals functionality
document.getElementById('meal-form')?.addEventListener('submit', addMeal);
let authToken = localStorage.getItem('token');

// Load meals from the API
function loadMeals() {
    fetch('http://localhost:4000/api/auth/meals', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const mealList = document.getElementById('meal-list');
            mealList.innerHTML = '';  // Clear existing list
            data.forEach(meal => {
                const li = document.createElement('li');
                li.textContent = `${meal.meal} - Type: ${meal.meal_type}, Times: ${meal.meal_type_times}, Date: ${new Date(meal.date).toLocaleDateString()}, Expiration: ${new Date(meal.food_expiration).toLocaleDateString()}`;
                mealList.appendChild(li);
            });
            displaySustainabilityTips();  // Call to display tips
        })
        .catch(error => {
            console.error('Error loading meals:', error);
        });
}

// Add a new meal
function addMeal(event) {
    event.preventDefault();

    const meal = document.getElementById('meal').value;
    const mealType = document.getElementById('meal_type').value;
    const mealTypeTimes = document.getElementById('meal_type_times').value;
    const date = document.getElementById('date').value;
    const foodExpiration = document.getElementById('food_expiration').value;

    fetch('http://localhost:4000/api/auth/meals', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            meal: meal,
            meal_type: mealType,
            meal_type_times: parseInt(mealTypeTimes),
            date: date,
            food_expiration: foodExpiration // Include expiration date
        })
    })
    .then(response => {
        // Check if the response is ok (status in the range 200-299)
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(text); // Throw an error with the response text
            });
        }
        return response.json(); // If response is ok, parse as JSON
    })
    .then(data => {
        loadMeals();  // Reload meals after adding a new one
        document.getElementById('meal-form').reset(); // Reset the form inputs
        alert('Meal added successfully!');
    })
    .catch(error => {
        console.error('Error adding meal:', error);
        alert('Error adding meal: ' + error.message); // Show error message
    });
}
// Display sustainability tips
function displaySustainabilityTips() {
    const sustainabilityTips = document.getElementById('sustainability-tips');
    sustainabilityTips.innerHTML = '';
    sustainabilityTips.innerHTML += "<h3>Sustainability Tips:</h3>";
    sustainabilityTips.innerHTML += "<p>Consider incorporating more plant-based meals into your diet for a reduced environmental impact.</p>";
    sustainabilityTips.innerHTML += "<p>Buy local and seasonal produce to support local farmers and reduce carbon footprints.</p>";
}

// Call loadMeals on page load to alert users of impending expiration dates
window.onload = () => {
    loadMeals();
};