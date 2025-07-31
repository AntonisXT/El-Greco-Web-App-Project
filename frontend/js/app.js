import { biographyContent } from './text.js';
import { login, isLoggedIn, logout } from './auth.js';
import {
  fetchExhibitions, fetchLinks,
  addExhibition, updateExhibition, deleteExhibition,
  addLink, updateLink, deleteLink
} from './fetchData.js';

const API_URL = "https://el-greco-app.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
  const loginFormContainer = document.getElementById('loginFormContainer');
  const loggedInContainer = document.getElementById('loggedInContainer');
  const managementMenu = document.getElementById('managementMenu');

  // Έλεγχος σύνδεσης χρήστη κατά τη φόρτωση
  if (isLoggedIn()) {
    loginFormContainer.classList.add('hidden');
    loggedInContainer.classList.remove('hidden');
    managementMenu.classList.add('visible');
  } else {
    loginFormContainer.classList.remove('hidden');
    loggedInContainer.classList.add('hidden');
    managementMenu.classList.remove('visible');
  }

  // Διαχείριση υποβολής σύνδεσης
  const loginForm = document.getElementById('loginForm');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const success = await login(username, password);
    if (success) {
      loginFormContainer.classList.add('hidden');
      loggedInContainer.classList.remove('hidden');
      managementMenu.classList.add('visible');
    }
  });

  // Διαχείριση αποσύνδεσης
  const logoutButton = document.getElementById('logoutButton');
  logoutButton.addEventListener('click', () => {
    logout();
    loginFormContainer.classList.remove('hidden');
    loggedInContainer.classList.add('hidden');
    managementMenu.classList.remove('visible');
  });

  // Πλοήγηση στο μενού
  const navLinks = document.querySelectorAll('nav a');
  const asideSections = document.querySelectorAll('aside > div');
  const mainContent = document.getElementById('content');

  navLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const section = event.target.dataset.section;

      // Εμφάνιση του σωστού περιεχομένου στο Aside
      asideSections.forEach(aside => aside.classList.add('hidden'));
      const asideToShow = document.getElementById(`aside-${section}`);
      if (asideToShow) asideToShow.classList.remove('hidden');

      // Ενημέρωση του Main
      switch (section) {
        case 'biography':
          mainContent.innerHTML = '<p>Επιλέξτε κατηγορία βιογραφίας απο το πλευρικό μενού.</p>';
          break;
        case 'paintings':
          mainContent.innerHTML = '<p>Επιλέξτε κατηγορία πίνακα από το πλευρικό μενού.</p>';
          break;
        case 'exhibitions':
          mainContent.innerHTML = '<p>Επιλέξτε κατηγορία εκθέσεων από το πλευρικό μενού.</p>';
          break;
        case 'links':
          mainContent.innerHTML = '<p>Επιλέξτε κατηγορία συνδέσμων από το πλευρικό μενού.</p>';
          break;
        case 'management':
          if (isLoggedIn()) {
            mainContent.innerHTML = '<p>Επιλέξτε ενέργεια από το μενού διαχείρισης.</p>';
          } else {
            mainContent.innerHTML = '<p>Παρακαλώ συνδεθείτε για πρόσβαση στη διαχείριση.</p>';
          }
          break;
        default:
          mainContent.innerHTML = '<p>Καλώς ήρθατε στην εφαρμογή.</p>';
      }
    });
  });

  // Διαχείριση κατηγοριών στο Aside
  const asideLinks = document.querySelectorAll('aside a');
  asideLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const category = event.target.dataset.category;
      const section = event.target.closest('div').id.replace('aside-', '');

      // Ενημέρωση περιεχομένου με βάση την κατηγορία
      if (section === 'biography') {
        mainContent.innerHTML = biographyContent[category] || '<p>Το περιεχόμενο δεν είναι διαθέσιμο.</p>';
      } else if (section === 'paintings') {
        let content = '';
        switch (category) {
          case 'portraits':
            content = `
              <div class="gallery">
                <img src="js/images/portrait_jeronimo.jpg" alt="Πορτρέτο 1">
                <img src="js/images/portrait_oldman.jpg" alt="Πορτρέτο 2">
                <img src="js/images/portrait_doctor.jpg" alt="Πορτρέτο 3">
                <img src="js/images/portrait_palladio.jpg" alt="Πορτρέτο 4">
                <img src="js/images/portrait_diego.jpg" alt="Πορτρέτο 5">
                <img src="js/images/portrait_female.jpg" alt="Πορτρέτο 6">
                <img src="js/images/portrait_alonso.jpg" alt="Πορτρέτο 7">
                <img src="js/images/portrait_pope.jpg" alt="Πορτρέτο 8">
                <img src="js/images/portrait_fray.jpg" alt="Πορτρέτο 9">
                <img src="js/images/portrait_cardinal.jpg" alt="Πορτρέτο 10">
              </div>`;
            break;
          case 'religious':
            content = `
              <div class="gallery">
                <img src="js/images/religious_stluke.jpg" alt="Θρησκευτικό 1">
                <img src="js/images/religious_baptism.jpg" alt="Θρησκευτικό 2">
                <img src="js/images/religious_dormition.jpg" alt="Θρησκευτικό 3">
                <img src="js/images/religious_mary.jpg" alt="Θρησκευτικό 4">
                <img src="js/images/religious_religion.jpg" alt="Θρησκευτικό 5">
                <img src="js/images/religious_cross.jpg" alt="Θρησκευτικό 6">
                <img src="js/images/religious_virgin.jpg" alt="Θρησκευτικό 7">
                <img src="js/images/religious_family.jpg" alt="Θρησκευτικό 8">
                <img src="js/images/religious_virginmary.jpg" alt="Θρησκευτικό 9">
                <img src="js/images/religious_john.jpg" alt="Θρησκευτικό 10">

              </div>`;
            break;
        }
        mainContent.innerHTML = content;
      }
    });
  });

  document.querySelectorAll('aside a[data-category]').forEach(link => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();
      const category = event.target.dataset.category;
      const section = event.target.closest('div').id.replace('aside-', '');

      if (section === 'exhibitions') {
        await loadExhibitionsByCategory(category);
      } else if (section === 'links') {
        await loadLinksByCategory(category);
      }
    });
  });

  // Διαχείριση εκθέσεων
  const manageExhibitions = document.getElementById('manageExhibitions');
  manageExhibitions.addEventListener('click', (e) => {
    e.preventDefault();
    const mainContent = document.getElementById('content');
    mainContent.innerHTML = `
      <h2>Διαχείριση Εκθέσεων</h2>
      <form id="exhibitionForm" class="management-form">
        <input type="hidden" id="exhibitionId">
        <div>
          <label for="title">Τίτλος:</label>
          <input type="text" id="title" required>
        </div>
        <div>
          <label for="date">Ημερομηνία:</label>
          <input type="text" id="date" required>
        </div>
        <div>
          <label for="location">Τοποθεσία:</label>
          <input type="text" id="location" required>
        </div>
        <div>
          <label for="category">Κατηγορία:</label>
          <select id="category" required>
            <option value="">Επιλέξτε κατηγορία</option>
            <option value="Μόνιμες Εκθέσεις">Μόνιμες Εκθέσεις</option>
            <option value="Περιοδικές Εκθέσεις">Περιοδικές Εκθέσεις</option>
            <option value="Ιστορικές Εκθέσεις">Ιστορικές Εκθέσεις</option>
          </select>
        </div>
        <button type="submit">Αποθήκευση</button>
      </form>
      <div id="exhibitionsList"></div>
    `;

    loadExhibitions();

    const form = document.getElementById('exhibitionForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const exhibition = {
        title: document.getElementById('title').value,
        date: document.getElementById('date').value,
        location: document.getElementById('location').value,
        category: document.getElementById('category').value
      };
      const id = document.getElementById('exhibitionId').value;

    try {
      if (id) {
        await updateExhibition(id, exhibition);
        alert('Η έκθεση ενημερώθηκε επιτυχώς!');
      } else {
        await addExhibition(exhibition);
        alert('Η έκθεση προστέθηκε επιτυχώς!');
      }
      form.reset();
      document.getElementById('exhibitionId').value = '';
      loadExhibitions();
    } catch (error) {
      console.error('Error:', error);
      alert('Παρουσιάστηκε σφάλμα. Παρακαλώ προσπαθήστε ξανά.');
    }
  });
});

  // Διαχείριση συνδέσμων
  const manageLinks = document.getElementById('manageLinks');
  manageLinks.addEventListener('click', (e) => {
    e.preventDefault();
    const mainContent = document.getElementById('content');
    // Στο manageLinks event listener
    mainContent.innerHTML = `
      <h2>Διαχείριση Συνδέσμων</h2>
      <form id="linkForm" class="management-form">
        <input type="hidden" id="linkId">
        <div>
          <label for="url">URL:</label>
          <input type="url" id="url" required>
        </div>
        <div>
          <label for="description">Περιγραφή:</label>
          <input type="text" id="description" required>
        </div>
        <div>
          <label for="category">Κατηγορία:</label>
          <select id="category" required>
            <option value="Διαδικτυακοί Σύνδεσμοι">Διαδικτυακοί Σύνδεσμοι</option>
            <option value="Βιβλιογραφία">Βιβλιογραφία</option>
            <option value="Σύνδεσμοι Μουσείων">Σύνδεσμοι Μουσείων</option>
          </select>
        </div>
        <button type="submit">Αποθήκευση</button>
      </form>
      <div id="linksList"></div>
    `;

    loadLinks();

    const form = document.getElementById('linkForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const link = {
        url: document.getElementById('url').value,
        description: document.getElementById('description').value,
        category: document.getElementById('category').value,
      };
      const id = document.getElementById('linkId').value;

      try {
        if (id) {
          await updateLink(id, link);
          alert('Ο σύνδεσμος ενημερώθηκε επιτυχώς!');
        } else {
          await addLink(link);
          alert('Ο σύνδεσμος προστέθηκε επιτυχώς!');
        }
        form.reset();
        document.getElementById('linkId').value = '';
        loadLinks();
      } catch (error) {
        alert('Παρουσιάστηκε σφάλμα. Παρακαλώ προσπαθήστε ξανά.');
      }
    });
  });
});

// Τροποποίηση της loadExhibitions()
async function loadExhibitions() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/exhibitions`, {
      headers: {
        'Authorization': token
      }
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const exhibitions = await response.json();
    const list = document.getElementById('exhibitionsList');
    list.innerHTML = exhibitions.map(ex => `
      <div class="item">
        <p>${ex.title} - ${ex.date} (${ex.location}) - ${ex.category}</p>
        <div class="manage-buttons">
          <button class="edit-button" onclick="editExhibition('${ex._id}', '${ex.title}', '${ex.date}', '${ex.location}', '${ex.category}')">
            Επεξεργασία
          </button>
          <button class="delete-button" onclick="deleteExhibition('${ex._id}')">
            Διαγραφή
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading exhibitions:', error);
    document.getElementById('exhibitionsList').innerHTML = 
      '<p>Σφάλμα κατά τη φόρτωση των εκθέσεων. Παρακαλώ προσπαθήστε ξανά.</p>';
  }
}

async function loadLinks() {
  try {
    const response = await fetch(`${API_URL}/api/links`);
    const links = await response.json();
    const list = document.getElementById('linksList');
    list.innerHTML = links.map(link => `
      <div class="item">
        <p><a href="${link.url}" target="_blank">${link.description}</a> (${link.category})</p>
        <div class="manage-buttons">
          <button class="edit-button" onclick="editLink('${link._id}', '${link.url}', '${link.description}', '${link.category}')">
            Επεξεργασία
          </button>
          <button class="delete-button" onclick="deleteLink('${link._id}')">
            Διαγραφή
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading links:', error);
    document.getElementById('linksList').innerHTML = 
      '<p>Σφάλμα κατά τη φόρτωση των συνδέσμων. Παρακαλώ προσπαθήστε ξανά.</p>';
  }
}

window.editExhibition = function(id, title, date, location, category) {
  document.getElementById('exhibitionId').value = id;
  document.getElementById('title').value = title;
  document.getElementById('date').value = date;
  document.getElementById('location').value = location;
  document.getElementById('category').value = category;
};

window.editLink = function(id, url, description, category) {
  document.getElementById('linkId').value = id;
  document.getElementById('url').value = url;
  document.getElementById('description').value = description;
  document.getElementById('category').value = category;
};

window.deleteExhibition = async function(id) {
  if (confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την έκθεση;')) {
    try {
      await deleteExhibition(id);
      loadExhibitions();
      alert('Η έκθεση διαγράφηκε επιτυχώς!');
    } catch (error) {
      alert('Σφάλμα κατά τη διαγραφή της έκθεσης. Παρακαλώ προσπαθήστε ξανά.');
    }
  }
};

window.deleteLink = async function(id) {
  if (confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το σύνδεσμο;')) {
    try {
      await deleteLink(id);
      await loadLinks();
      alert('Ο σύνδεσμος διαγράφηκε επιτυχώς!');
    } catch (error) {
      console.error('Error:', error);
      alert('Σφάλμα κατά τη διαγραφή του συνδέσμου. Παρακαλώ προσπαθήστε ξανά.');
    }
  }
};

async function loadExhibitionsByCategory(category) {
  try {
    const response = await fetch(`${API_URL}/api/exhibitions`);
    const exhibitions = await response.json();
    const filteredExhibitions = exhibitions.filter(ex => ex.category === category);
    
    const mainContent = document.getElementById('content');
    mainContent.innerHTML = `
      <h2>${category}</h2>
      <div id="exhibitionsList">
        ${filteredExhibitions.map(ex => `
          <div class="exhibition-item">
            <h3>${ex.title}</h3>
            <p>Ημερομηνία: ${ex.date}</p>
            <p>Τοποθεσία: ${ex.location}</p>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('content').innerHTML = 
      '<p>Σφάλμα κατά τη φόρτωση των εκθέσεων.</p>';
  }
}

async function loadLinksByCategory(category) {
  try {
    const response = await fetch(`${API_URL}/api/links`);
    const links = await response.json();
    const filteredLinks = links.filter(link => link.category === category);
    
    const mainContent = document.getElementById('content');
    mainContent.innerHTML = `
      <h2>${category}</h2>
      <div id="linksList">
        ${filteredLinks.map(link => `
          <div class="link-item">
            <h3>${link.description}</h3>
            <p><a href="${link.url}" target="_blank">${link.url}</a></p>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('content').innerHTML = 
      '<p>Σφάλμα κατά τη φόρτωση των συνδέσμων.</p>';
  }
}
