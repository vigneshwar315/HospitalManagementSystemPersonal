export const searchMedicines = async (query) => {
  try {
    const response = await fetch("http://localhost:3001/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicines: query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      results: data.medicines || []
    };
  } catch (err) {
    console.error('API Error:', err);
    return {
      success: false,
      error: err.message || "Failed to connect to GenAI server"
    };
  }
};
