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
            li.textContent = `${meal.meal} - Type: ${meal.meal_type}, Times: ${meal.meal_type_times}, Date: ${new Date(meal.date).toLocaleDateString()}`;

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

            mealList.appendChild(li);
        });

        // Sustainability tips
        const sustainabilityTips = document.getElementById('sustainability-tips');
        sustainabilityTips.innerHTML = '';
        sustainabilityTips.innerHTML += "<h3>Sustainability Tips:</h3>";
        sustainabilityTips.innerHTML += "<p>Consider incorporating more plant-based meals into your diet for a reduced environmental impact.</p>";
        sustainabilityTips.innerHTML += "<p>Buy local and seasonal produce to support local farmers and reduce carbon footprints.</p>";
    });
}

function addMeal(event) {
    event.preventDefault();

    const mealName = document.getElementById('meal_name').value;
    const mealType = document.getElementById('meal_type').value;
    const mealTypeTimes = document.getElementById('meal_type_times').value;

    fetch('http://localhost:4000/api/auth/meals', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ meal: mealName, meal_type: mealType, meal_type_times: parseInt(mealTypeTimes) })
    })
    .then(response => response.json())
    .then(data => {
        loadMeals();
        document.getElementById('meal_name').value = '';
        document.getElementById('meal_type').value = '';
        document.getElementById('meal_type_times').value = '';
        // Redirect to food page after adding meals
        window.location.href = 'food.html';  // Redirect to food page
    });
}

// Food form submission logic
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('food-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const foodName = document.getElementById('food_name').value;
        const foodExpiration = document.getElementById('food_expiration').value;

        // Fetch API to add food
        const response = await fetch('http://localhost:4000/api/auth/foods', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name: foodName, expiration: foodExpiration })
        });

        const data = await response.json();
        // Redirect to meals page after successfully adding food
        if (response.ok) {
            alert('Food added successfully!');
            window.location.href = 'meals.html';  // Redirect to meals page
        } else {
            alert(data.message);
        }
    });
});

// Added functionality to reduce food waste
function checkExpiration() {
    fetch('http://localhost:4000/api/auth/foods', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        console.log(response); // Logging response
        return response.json();
    })
    .then(data => {
        console.log(data); // Log the fetched foods to see their details
        const foodList = document.getElementById('food-list');
        foodList.innerHTML = '';

        if (Array.isArray(data)) {
            data.forEach(food => {
                const li = document.createElement('li');
                li.textContent = `${food.name} - Expiration Date: ${new Date(food.expiration).toLocaleDateString()}`;
                const daysLeft = Math.ceil((new Date(food.expiration) - new Date()) / (1000 * 60 * 60 * 24));

                if (daysLeft <= 3) {
                    li.style.color = 'red';
                    const reminder = document.createElement('div');
                    reminder.textContent = `Use this food soon to avoid waste!`;
                    reminder.style.color = 'green';
                    li.appendChild(reminder);
                }

                foodList.appendChild(li);
            });
        } else {
            console.error('Response data is not an array.');
        }
    })
    .catch(err => console.error('Error fetching foods:', err));
}
// Call checkExpiration on page load to alert users of impending expiration dates
window.onload = () => {
    loadMeals();
    checkExpiration(); // Check for food nearing expiration
};