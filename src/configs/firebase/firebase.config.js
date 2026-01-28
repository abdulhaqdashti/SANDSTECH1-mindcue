const admin = require("firebase-admin");

class Firebase {
  constructor(name) {
    try {
      const serviceAccount = process.env.FIREBASE_AUTH;
      this.admin = admin.initializeApp(
        {
          credential: admin.credential.cert(serviceAccount),
        },
        name
      );
    } catch (error) {
      console.error("Error initializing Firebase:", error);
    }
  }
}

module.exports = Firebase;
