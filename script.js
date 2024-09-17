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

// Meals

document.getElementById('meal-form')?.addEventListener('submit', addMeal);
let authToken = localStorage.getItem('token');

function loadMeals() {
    fetch('http://localhost:4000/api/auth/meals', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(response => response.json())
    .then(data => {
        const mealList = document.getElementById('meal-list');
        mealList.innerHTML = '';
        data.forEach(meal => {
            const li = document.createElement('li');
            li.textContent = `${meal.meal} - Type: ${meal.meal_type}, Times: ${meal.meal_type_times}, Date: ${new Date(meal.date).toLocaleDateString()}, Expiration: ${new Date(meal.food_expiration).toLocaleDateString()}`;

            // Highlight problematic meals
            if (meal.meal_type.toLowerCase() === 'fat' || meal.meal_type.toLowerCase() === 'protein') {
                li.style.color = 'red'; // Highlight
                if (meal.meal_type_times > 1) {
                    const recommendation = document.createElement('div');
                    recommendation.textContent = `Consider reducing ${meal.meal_type} intake.`;
                    recommendation.style.color = 'green';
                    li.appendChild(recommendation);
                }
            }

            // Check for expiration and alert
            const daysLeft = Math.ceil((new Date(meal.food_expiration) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 3) {
                li.style.color = 'orange'; // Highlight near expiration
                const reminder = document.createElement('div');
                reminder.textContent = `Use this meal soon to avoid waste!`;
                reminder.style.color = 'red';
                li.appendChild(reminder);
            }

            mealList.appendChild(li);
        });

        // Sustainability tips
        displaySustainabilityTips();
    });
}
// add meal

function addMeal(event) {
    event.preventDefault();

    const mealName = document.getElementById('meal_name').value;
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
            meal: mealName,
            meal_type: mealType,
            meal_type_times: parseInt(mealTypeTimes),
            date: date,
            food_expiration: foodExpiration // Send expiration date
        })
    })
    .then(response => response.json())
    .then(data => {
        loadMeals();
        document.getElementById('meal_name').value = '';
        document.getElementById('meal_type').value = '';
        document.getElementById('meal_type_times').value = '';
        document.getElementById('date').value= '';
        document.getElementById('food_expiration').value = ''; // Clear expiration input
        alert('Meal added successfully!');
    });
}

// Sustainability tips display function
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