const fb = require("firebase")

const firebaseConfig = {
  apiKey: "AIzaSyAdXvShDFiCvEjHE2e7s98t32DugzFzbMA",
  authDomain: "abcsozluk-df517.firebaseapp.com",
  databaseURL: "https://abcsozluk-df517-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "abcsozluk-df517",
  storageBucket: "abcsozluk-df517.appspot.com",
  messagingSenderId: "1079491628657",
  appId: "1:1079491628657:web:88cb2738fff893a47995d0",
  measurementId: "G-D13S4HQS4W"
}

fb.initializeApp(firebaseConfig)

module.exports = { fb }