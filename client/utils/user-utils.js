export function getCurrentUserValue(value) {
  return JSON.parse(localStorage.getItem('user') || '{}')[value];
} 
