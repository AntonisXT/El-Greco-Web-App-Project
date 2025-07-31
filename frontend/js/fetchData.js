const API_URL = "https://el-greco-app.onrender.com";
import { fetchWithAuth } from './auth.js';

export async function fetchExhibitions() {
  try {
    const response = await fetch(`${API_URL}/api/exhibitions`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const exhibitions = await response.json();
    return exhibitions;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function addExhibition(exhibition) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/exhibitions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exhibition),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to add exhibition');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in addExhibition:', error);
    throw error;
  }
}


export async function updateExhibition(id, exhibition) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/exhibitions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exhibition),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to update exhibition');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in updateExhibition:', error);
    throw error;
  }
}

export async function deleteExhibition(id) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/exhibitions/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to delete exhibition');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in deleteExhibition:', error);
    throw error;
  }
}

// Σύνδεσμοι
export async function fetchLinks() {
  try {
    const response = await fetch(`${API_URL}/api/links`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function addLink(link) {
  const response = await fetchWithAuth(`${API_URL}/api/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(link),
  });
  return response.json();
}

export async function updateLink(id, link) {
  const response = await fetchWithAuth(`${API_URL}/api/links/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(link),
  });
  return response.json();
}

export async function deleteLink(id) {
  try {
    const response = await fetchWithAuth(`${API_URL}/api/links/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to delete link');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in deleteLink:', error);
    throw error;
  }
}
