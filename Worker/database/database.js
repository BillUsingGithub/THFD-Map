const admin = require("firebase-admin");
const serviceAccount = require("YOUR_KEY.json");

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: process.env.FIREBASE_DATABASE_URL,
	databaseAuthVariableOverride: {
		uid: "worker-database"
	}
});

const db = admin.database();

db.ref("/Companies").on("child_added", function(snapshot) {
	db.ref("/Index/Companies/" + snapshot.key).set(true);
});

db.ref("/Companies").on("child_removed", function(snapshot) {
	db.ref("/Index/Companies/" + snapshot.key).remove();
});

db.ref("/Hydrants").on("child_added", function(snapshot) {
	db.ref("/Index/Hydrants/" + snapshot.key).set(true);
});

db.ref("/Hydrants").on("child_removed", function(snapshot) {
	db.ref("/Index/Hydrants/" + snapshot.key).remove();
});

db.ref("/Ports").on("child_added", function(snapshot) {
	db.ref("/Index/Ports/" + snapshot.key).set(true);
});

db.ref("/Ports").on("child_removed", function(snapshot) {
	db.ref("/Index/Ports/" + snapshot.key).remove();
});
