import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  EN: {
    translation: {
      welcome: "Welcome to VitaLens",
      subtitle: "Your personal nutrition assistant.",
      welcome_back: "WELCOME BACK",
      email: "EMAIL ADDRESS",
      password: "PASSWORD",
      sign_in: "SIGN IN",
      or: "OR",
      google: "Login with Google",
      signup_link: "NEED AN ACCOUNT? SIGN UP",
      tab_meal: "MEAL ANALYZER",
      tab_barcode: "BARCODE SCAN",
      tab_goals: "MY GOALS"
    }
  },
  తెలుగు: {
    translation: {
      welcome: "VitaLens కు స్వాగతం",
      subtitle: "మీ వ్యక్తిగత పోషకాహార సహాయకి.",
      welcome_back: "తిరిగి స్వాగతం",
      email: "ఈమెయిల్ చిరునామా",
      password: "పాస్‌వర్డ్",
      sign_in: "లాగిన్",
      or: "లేదా",
      google: "Google తో లాగిన్ చేయండి",
      signup_link: "ఖాతా లేదా? సైన్ అప్",
      tab_meal: "భోజన విశ్లేషణ",
      tab_barcode: "బార్‌కోడ్ స్కాన్",
      tab_goals: "నా లక్ష్యాలు"
    }
  },
  HI: {
    translation: {
      welcome: "VitaLens में आपका स्वागत है",
      subtitle: "आपका व्यक्तिगत पोषण सहायक।",
      welcome_back: "वापसी पर स्वागत है",
      email: "ईमेल पता",
      password: "पासवर्ड",
      sign_in: "साइन इन करें",
      or: "या",
      google: "Google के साथ लॉगिन",
      signup_link: "खाता चाहिए? साइन अप करें",
      tab_meal: "भोजन विश्लेषक",
      tab_barcode: "बारकोड स्कैन",
      tab_goals: "मेरे लक्ष्य"
    }
  },
  ES: {
    translation: {
      welcome: "Bienvenido a VitaLens",
      subtitle: "Tu asistente de nutrición personal.",
      welcome_back: "BIENVENIDO DE NUEVO",
      email: "DIRECCIÓN DE CORREO",
      password: "CONTRASEÑA",
      sign_in: "INICIAR SESIÓN",
      or: "O",
      google: "Iniciar sesión con Google",
      signup_link: "¿NECESITAS UNA CUENTA? REGÍSTRATE",
      tab_meal: "ANALIZADOR",
      tab_barcode: "ESCANEO",
      tab_goals: "MIS METAS"
    }
  },
  FR: {
    translation: {
        welcome: "Bienvenue sur VitaLens",
        subtitle: "Votre assistant nutritionnel personnel.",
        welcome_back: "BON RETOUR",
        email: "ADRESSE E-MAIL",
        password: "MOT DE PASSE",
        sign_in: "SE CONNECTER",
        or: "OU",
        google: "Se connecter avec Google",
        signup_link: "BESOIN D'UN COMPTE? S'INSCRIRE",
        tab_meal: "ANALYSEUR",
        tab_barcode: "SCANNER",
        tab_goals: "MES OBJECTIFS"
    }
  },
  DE: {
    translation: {
      welcome: "Willkommen bei VitaLens",
      subtitle: "Ihr persönlicher Ernährungsassistent.",
      welcome_back: "WILLKOMMEN ZURÜCK",
      email: "E-MAIL",
      password: "PASSWORT",
      sign_in: "ANMELDEN",
      or: "ODER",
      google: "Mit Google anmelden",
      signup_link: "KONTO BENÖTIGT? REGISTRIEREN",
      tab_meal: "ANALYSE",
      tab_barcode: "SCANNEN",
      tab_goals: "MEINE ZIELE"
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'EN', // default language
  fallbackLng: 'EN',
  interpolation: {
    escapeValue: false 
  }
});

export default i18n;
