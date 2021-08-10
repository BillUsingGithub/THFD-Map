const algoliasearch = require("algoliasearch");
const admin = require("firebase-admin");
const serviceAccount = require("YOUR_KEY.json");

const algolia = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY);
const index = algolia.initIndex(process.env.ALGOLIA_INDEX_NAME);

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: process.env.FIREBASE_DATABASE_URL,
	databaseAuthVariableOverride: {
		uid: "worker-algolia"
	}
});

const db = admin.database();

db.ref("/Index/Companies").on("child_added", function(cID) {
	const cKey = cID.key;

	db.ref("/Companies/" + cKey).on("value", function(snapshot) {
		const data = new Object();

		data.objectID = cKey;
		data.category = "Company";
		data.name = snapshot.child("Name").val();
		data._geoloc = new Object();
		data._geoloc.lat = snapshot.child("Position").child("WGS_Y").val();
		data._geoloc.lng = snapshot.child("Position").child("WGS_X").val();

		index.partialUpdateObject(data, {
			createIfNotExists: true
		}).then(function(objID) {
			console.log(objID);
		}).catch(function(err) {
			console.log(err);
		});
	});
});

db.ref("/Index/Companies").on("child_removed", function(cID) {
	const cKey = cID.key;

	index.deleteObject(cKey).then(function() {
		console.log("Delete " + cKey);
	}).catch(function(err) {
		console.log(err);
	});
});

db.ref("/Index/Ports").on("child_added", function(pID) {
	const pKey = pID.key;

	db.ref("/Ports/" + pKey).on("value", function(snapshot) {
		const data = new Object();

		data.objectID = pKey;
		data.category = "Port";
		data.name = snapshot.child("Name").val();
		data._geoloc = new Object();
		data._geoloc.lat = snapshot.child("Position").child("WGS_Y").val();
		data._geoloc.lng = snapshot.child("Position").child("WGS_X").val();

		index.partialUpdateObject(data, {
			createIfNotExists: true
		}).then(function(objID) {
			console.log(objID);
		}).catch(function(err) {
			console.log(err);
		});
	});
});

db.ref("/Index/Ports").on("child_removed", function(pID) {
	const pKey = pID.key;

	index.deleteObject(pKey).then(function() {
		console.log("Delete " + pKey);
	}).catch(function(err) {
		console.log(err);
	});
});
