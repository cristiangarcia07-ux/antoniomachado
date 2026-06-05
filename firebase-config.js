// ═══════════════════════════════════════════════════════════════
//  FIREBASE CONFIGURATION
//  ═══════════════════════════════════════════════════════════════
//  Reemplaza estos valores con los de tu proyecto Firebase.
//  Para obtenerlos: Consola Firebase → Configuración del proyecto
//  → Tus aplicaciones → Web → Copiar objeto de configuración.
// ═══════════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey:            "AIzaSyBTFrjlgQ9d54sItwkDcnyTe2nH8l92XaE",
  authDomain:        "bentilos.firebaseapp.com",
  projectId:         "bentilos",
  storageBucket:    "bentilos.firebasestorage.app",
  messagingSenderId: "156073391416",
  appId:            "1:156073391416:web:937914228a59674a1abdcd",
  measurementId:     "G-4SMMZGF4VP"
};

// Inicializar Firebase (se ejecuta al cargar el script)
firebase.initializeApp(firebaseConfig);
