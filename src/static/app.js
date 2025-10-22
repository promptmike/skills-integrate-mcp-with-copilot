document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const activitySearch = document.getElementById("activity-search");
  const activitySort = document.getElementById("activity-sort");

    // Store activities in memory for filtering/sorting
    let allActivities = {};

    // Function to render activities with filters/sorting
    function renderActivities() {
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = "";
      // Get filter values
      const searchValue = activitySearch.value.toLowerCase();
      const sortValue = activitySort.value;

      // Convert activities to array for sorting/filtering
      let filtered = Object.entries(allActivities)
        .filter(([name, details]) => {
          // Free text search: name, description, schedule
          return (
            name.toLowerCase().includes(searchValue) ||
            details.description.toLowerCase().includes(searchValue) ||
            details.schedule.toLowerCase().includes(searchValue)
          );
        });

      // Sorting
      if (sortValue === "name") {
        filtered.sort((a, b) => a[0].localeCompare(b[0]));
      } else if (sortValue === "time") {
        filtered.sort((a, b) => {
          // Try to extract time from schedule string
          const timeA = a[1].schedule.match(/(\d{1,2}:\d{2}\s*[APMapm]*)/);
          const timeB = b[1].schedule.match(/(\d{1,2}:\d{2}\s*[APMapm]*)/);
          return (timeA ? timeA[0] : "") < (timeB ? timeB[0] : "") ? -1 : 1;
        });
      }

      filtered.forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        const spotsLeft = details.max_participants - details.participants.length;
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
                <h5>Participants:</h5>
                <ul class="participants-list">
                  ${details.participants
                    .map(
                      (email) =>
                        `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                    )
                    .join("")}
                </ul>
              </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    }

    // Fetch activities from API and store in memory
    async function fetchActivities() {
      try {
        const response = await fetch("/activities");
        allActivities = await response.json();
        renderActivities();
      } catch (error) {
        activitiesList.innerHTML =
          "<p>Failed to load activities. Please try again later.</p>";
        console.error("Error fetching activities:", error);
      }
    }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Filter and sort event listeners
  activitySearch.addEventListener("input", renderActivities);
  activitySort.addEventListener("change", renderActivities);

  // Initialize app
  fetchActivities();
});
