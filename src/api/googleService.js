import axios from 'axios';

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_APP_SCRIPT_URL;

// Mock fallback for testing if API is not available or errors out
const mockQuestions = [
  { id: 1, question: "What is 1+1?", A: "1", B: "2", C: "3", D: "4", answer: "B" },
  { id: 2, question: "Which language is React built on?", A: "Java", B: "Python", C: "JavaScript", D: "C++", answer: "C" },
  { id: 3, question: "Is Vite faster than CRA?", A: "Yes", B: "No", C: "Maybe", D: "Don't know", answer: "A" },
  { id: 4, question: "What does CSS stand for?", A: "Cascading Style Sheets", B: "Color Style Sheets", C: "Creative Style System", D: "Computer Style System", answer: "A" },
  { id: 5, question: "What is the passing threshold?", A: "1", B: "2", C: "3", D: "4", answer: "C" }
];

export const fetchQuestions = async (count = import.meta.env.VITE_QUESTION_COUNT || 5) => {
  try {
    if (!SCRIPT_URL) throw new Error("No SCRIPT_URL defined");
    // Depending on GAS setup, might be a POST or GET. Assume GET for "getQuestions"
    const response = await axios.get(`${SCRIPT_URL}?action=getQuestions&count=${count}`);
    if (response.data && response.data.questions) {
      return response.data.questions;
    }
    return mockQuestions.slice(0, count);
  } catch (error) {
    console.error("Error fetching questions, using mock data.", error);
    return mockQuestions.slice(0, count);
  }
};

export const submitScore = async (id, totalScore, passed, attempts) => {
  try {
    if (!SCRIPT_URL) throw new Error("No SCRIPT_URL defined");
    const response = await axios.post(
      SCRIPT_URL,
      JSON.stringify({
        action: 'submitScore',
        id,
        totalScore,
        passed,
        attempts
      }),
      {
        headers: { 'Content-Type': 'text/plain;charset=utf-8' } // GAS handles text/plain without preflight CORS issues
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting score.", error);
    return { success: false, message: "Network Error" };
  }
};
