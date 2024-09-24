// Registration handler
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullname = document.getElementById('full_name').value;
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const response = await fetch('http://localhost:3000/api/auth/register', {
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

        const response = await fetch('http://localhost:3000/api/auth/login', {
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
// Set current date for the meal date input and load meals
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("date").value = today;
    loadMeals();  // Load previously entered meals
 });
 
 // Meals functionality
 document.getElementById('meal-form')?.addEventListener('submit', addMeal);
 
 async function addMeal(event) {
     event.preventDefault();
 
     const authToken = localStorage.getItem('token'); // Ensure you fetch the token from local storage
     const meal = document.getElementById('meal').value;
     const mealType = document.getElementById('meal_type').value;
     const mealTypeTimes = document.getElementById('meal_type_times').value;
     const date = document.getElementById('date').value;
     const foodExpiration = document.getElementById('food_expiration').value;
 
     try {
         const response = await fetch('http://localhost:3000/api/auth/meals', {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${authToken}`
             },
             body: JSON.stringify({
                 meal: meal,
                 meal_type: mealType,
                 meal_type_times: parseInt(mealTypeTimes, 10),
                 date: date,
                 food_expiration: foodExpiration
             })
         });
 
         const data = await response.json();
         alert(data.message); // Show the message returned from the server
 
         if (response.ok) {
             loadMeals(); // Reload meals after adding a new one
             document.getElementById('meal-form').reset(); // Reset the form inputs
         }
     } catch (error) {
         console.error('Error adding meal:', error);
         alert('Error adding meal: ' + error.message); // Show error message
     }
 }
 // Function to load meals
async function loadMeals() {
    const authToken = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/auth/meals', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });

    const meals = await response.json();
    const mealList = document.getElementById('meal-list').getElementsByTagName('tbody')[0];
    mealList.innerHTML = ''; // Clear existing meals

    meals.forEach(meal => {
        const row = mealList.insertRow(); // Create a new row
        row.innerHTML = `
            <td>${meal.meal}</td>
            <td>${meal.meal_type}</td>
            <td>${meal.meal_type_times}</td>
            <td>${meal.date}</td>
            <td>${meal.food_expiration}</td>
            <td><button onclick="deleteMeal(${meal.id})">Delete</button></td>
        `;
    });
}

// Function to delete a meal
async function deleteMeal(id) {
    console.log(`Deleting meal with ID: ${id}`);
    const authToken = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:3000/api/auth/meals/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` },
        });

        const data = await response.json();
        alert(data.message);
        
        if (response.ok) {
            loadMeals(); // Refresh meals list after deletion
        }
    } catch (error) {
        console.error('Error deleting meal:', error);
        alert('Error deleting meal: ' + error.message);
    }
}

// Call loadMeals on page load to alert users of impending expiration dates
window.onload = () => {
    loadMeals();
};