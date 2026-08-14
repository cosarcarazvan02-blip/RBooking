// Backend-ul (RBooking.API) răspunde mereu cu mesaje de eroare în română.
// Interfața suportă RO/EN, așa că traducem aici mesajele cunoscute înainte
// de a le afișa - fallback la textul original dacă nu-l recunoaștem.
const KNOWN_MESSAGES: Record<string, string> = {
  "Datele de autentificare sunt obligatorii.": "Login details are required.",
  "Datele de înregistrare sunt obligatorii.": "Registration details are required.",
  "Adresa de email este obligatorie.": "Email address is required.",
  "Formatul adresei de email este invalid (ex: nume@exemplu.com).":
    "Invalid email format (e.g. name@example.com).",
  "Parola este obligatorie.": "Password is required.",
  "Parola trebuie să conțină cel puțin 6 caractere.": "Password must be at least 6 characters long.",
  "Parola este prea slabă. Foloseste minim 8 caractere, cu cel puțin o literă mare, o literă mică și o cifră.":
    "Password is too weak. Use at least 8 characters, with at least one uppercase letter, one lowercase letter, and one digit.",
  "Există deja un cont cu acest email. Te poți autentifica direct.":
    "An account with this email already exists. You can log in directly.",
  "Nu există niciun cont cu acest email. Te rugăm să îți creezi unul din pagina de înregistrare.":
    "No account found with this email. Please create one from the registration page.",
  "Email sau parolă incorectă.": "Incorrect email or password.",
};

export function translateApiError(message: string | undefined | null, lang: string): string {
  if (!message) return "";
  if (lang !== "EN") return message;
  return KNOWN_MESSAGES[message] || message;
}
