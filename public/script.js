const API_URL = "/users";

// Load users on page load
fetchUsers();

function fetchUsers() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("usersTable");
      table.innerHTML = "";

      data.forEach(user => {
        table.innerHTML += `
          <tr>
            <td><input value="${user.name}" id="name-${user._id}"></td>
            <td><input value="${user.email}" id="email-${user._id}"></td>
            <td><input value="${user.age}" id="age-${user._id}" type="number"></td>
            <td>
              <button onclick="updateUser('${user._id}')">Update</button>
              <button onclick="deleteUser('${user._id}')">Delete</button>
            </td>
          </tr>
        `;
      });
    });
}

// CREATE
function addUser() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const age = document.getElementById("age").value;

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, age })
  }).then(() => {
    fetchUsers();
    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("age").value = "";
  });
}

// UPDATE
function updateUser(id) {
  const name = document.getElementById(`name-${id}`).value;
  const email = document.getElementById(`email-${id}`).value;
  const age = document.getElementById(`age-${id}`).value;

  fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, age })
  }).then(fetchUsers);
}

// DELETE
function deleteUser(id) {
  fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  }).then(fetchUsers);
}
