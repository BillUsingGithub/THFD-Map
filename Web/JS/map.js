let dashboard;
let dom;
let link;
let place;
let tool;

function main()
{
	initVariable();
	initMap();
	initMapUI();
	//initListener();
	initService();
	initSearch();
	initPrecinct();

	watchAuth();
	watchMapClick();
	watchMapZoom();

	initCompanies();
	initHydrants();
	initPorts();
}

function initVariable()
{
	dashboard = new Object();
	dashboard.focus = new Object();
	dashboard.focus.marker = [];
	dashboard.focus.category = [];
	dashboard.searchIndex = 0;
	dashboard.searchMarkers = [];
	dashboard.userInfo = new Object();
	dashboard.userInfo.marker = new google.maps.Marker();
	dashboard.initZoom = 12;
	dashboard.iconSize = new Object();
	dashboard.showIcon = new Object();
	dashboard.labelSize = new Object();

	dom = new Object();
	dom.autocomplete = document.getElementById("autocomplete");
	dom.hits = document.getElementById("hits");
	dom.hitList = document.getElementById("hit-list");
	dom.map = document.getElementById("map");
	dom.searchBox = document.getElementById("search-box");
	dom.searchInput = document.getElementById("search-input");
	dom.searchInput.onblur = async function(evt) {
		await sleep(200);
		dom.searchList.style.display = "none";
	};
	dom.searchInput.onfocus = function(evt) {
		dom.searchList.style.display = "block";
	};
	dom.searchInput.onkeydown = function(evt) {
		const childNodes = dom.searchList.childNodes;

		//console.log(evt.code);

		switch (evt.code) {
			case "ArrowDown":
				if (evt.isComposing) {
					break;
				}
				if (dashboard.searchIndex != childNodes.length) {
					childNodes[dashboard.searchIndex].style.backgroundColor = "";
				}
				dashboard.searchIndex = (dashboard.searchIndex < childNodes.length) ? (dashboard.searchIndex + 1) : 0;
				if (dashboard.searchIndex < childNodes.length) {
					dom.searchInput.value = childNodes[dashboard.searchIndex].value;
					childNodes[dashboard.searchIndex].style.backgroundColor = "#DFDFDF";
				}
				else {
					dom.searchInput.value = dashboard.searchValue;
				}
				break;
			case "ArrowUp":
				if (evt.isComposing) {
					break;
				}
				if (dashboard.searchIndex != childNodes.length) {
					childNodes[dashboard.searchIndex].style.backgroundColor = "";
				}
				dashboard.searchIndex = (dashboard.searchIndex === 0) ? childNodes.length : (dashboard.searchIndex - 1);
				if (dashboard.searchIndex < childNodes.length) {
					dom.searchInput.value = childNodes[dashboard.searchIndex].value;
					childNodes[dashboard.searchIndex].style.backgroundColor = "#DFDFDF";
				}
				else {
					dom.searchInput.value = dashboard.searchValue;
				}
				break;
			case "Enter":
			case "NumpadEnter":
				dom.searchInput.dispatchEvent(new Event("input"));
				break;
			default:
				break;
		}
	};
	dom.searchList = document.getElementById("search-list");
	dom.searchPanel = document.getElementById("search-panel");

	link = new Object();
	link.cIndex = firebase.database().ref("/Index/Companies");
	link.hIndex = firebase.database().ref("/Index/Hydrants");
	link.pIndex = firebase.database().ref("/Index/Ports");
	link.cRef = firebase.database().ref("/Companies");
	link.hRef = firebase.database().ref("/Hydrants");
	link.pRef = firebase.database().ref("/Ports");
	link.uRef = firebase.database().ref("/Users");
	link.fpStorage = firebase.storage().ref("/FloorPlan");

	place = new Object();

	tool = new Object();
	tool.appCheck = firebase.appCheck();
	tool.appCheck.activate("6LfCiMcbAAAAAAVe-LSVhPhBsdr7rctablCdEmi7");
	tool.infoWindow = new google.maps.InfoWindow();
	tool.infoWindow.addListener("closeclick", function() {
		tool.tmpPlace.marker.setMap(null);
	});
	tool.icon = new Object();
	tool.label = new Object();
	tool.mapStyles = new Object();
	tool.performance = firebase.performance();
	tool.tmpPlace = new Object();
	tool.tmpPlace.marker = new google.maps.Marker();
	tool.tmpPlace.marker.setMap(null);
	tool.tmpPlace.key = null;
}

function initMap()
{
	tool.mapStyles.origin = [];
	tool.mapStyles.hide = [
		{
			featureType: "poi.business",
			stylers: [{visibility: "off"}]
		}
	];

	// Reference: https://developers.google.com/maps/documentation/javascript/reference/map
	tool.map = new google.maps.Map(dom.map, {
		center: { lat: 24.238194, lng: 120.505755 },
		controlSize: 32,
		draggableCursor: "default",	// Reference: https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
		draggingCursor: "move",
		fullscreenControl: false,
		gestureHandling: "greedy",
		mapTypeControl: true,
		mapTypeControlOptions: {
			//mapTypeIds: ["hybrid", "roadmap", "satellite", "terrain"],
			mapTypeIds: ["hybrid", "roadmap"],
			//position: google.maps.ControlPosition.LEFT_BOTTOM,
			position: google.maps.ControlPosition.BOTTOM_CENTER,
			style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR
		},
		rotateControl: true,
		scaleControl: true,
		streetViewControl: true,
		styles: tool.mapStyles.hide,
		zoom: dashboard.initZoom,
		zoomControl: true,
		zoomControlOptions: {
			style: google.maps.ZoomControlStyle.SMALL
		}
	});
}

function initMapUI()
{
	dom.signin = document.createElement("div");
	dom.signin.setAttribute("class", "map-ui");
	dom.signin.setAttribute("id", "sign-in");
	dom.signin.onclick = function() {
		signIn();
	};

	dom.showObject = document.createElement("div");
	dom.showObject.setAttribute("class", "map-ui");
	dom.showObject.setAttribute("id", "show-object");
	dom.showObject.innerHTML = "<i class=\"fas fa-eye\"></i>";
	dom.showObject.onclick = function() {
		toggleShow(dom.showObjectCard);
	};

	dom.showObjectCard = document.createElement("div");
	dom.showObjectCard.setAttribute("id", "show-object-card");
	dom.showObjectCard.style.display = "none";
	document.body.appendChild(dom.showObjectCard);

	dom.showObjectOption = document.createElement("label");
	dom.showObjectOption.setAttribute("id", "show-object-option");
	dom.showObjectCard.appendChild(dom.showObjectOption);

	dom.showCompanies = document.createElement("input");
	dom.showCompanies.setAttribute("id", "show-companies");
	dom.showCompanies.setAttribute("name", "show-companies");
	dom.showCompanies.setAttribute("type", "checkbox");
	dom.showCompanies.addEventListener("change", function(evt) {
		const toMap = evt.currentTarget.checked ? tool.map : null;

		for (const key in place.company)
		{
			place.company[key].marker.setMap(toMap);
		}

		focusMarker();
	});
	dom.showCompaniesLabel = document.createElement("label");
	dom.showCompaniesLabel.setAttribute("for", "show-companies");
	dom.showCompaniesLabel.innerText = "場所";
	dom.showObjectCard.appendChild(dom.showCompanies);
	dom.showObjectCard.appendChild(dom.showCompaniesLabel);
	dom.showObjectCard.appendChild(document.createElement("br"));

	dom.showHydrants = document.createElement("input");
	dom.showHydrants.setAttribute("id", "show-hydrants");
	dom.showHydrants.setAttribute("name", "show-hydrants");
	dom.showHydrants.setAttribute("type", "checkbox");
	dom.showHydrants.addEventListener("change", function(evt) {
		const toMap = evt.currentTarget.checked ? tool.map : null;

		for (const key in place.hydrant)
		{
			const hObj = place.hydrant[key];

			switch (hObj.type)
			{
				case 1:
				case 2:
				case 3:
					hObj.marker.setMap(toMap);
					break;
				default:
					break;
			}
		}

		focusMarker();
	});
	dom.showHydrantsLabel = document.createElement("label");
	dom.showHydrantsLabel.setAttribute("for", "show-hydrants");
	dom.showHydrantsLabel.innerText = "消防栓";
	dom.showObjectCard.appendChild(dom.showHydrants);
	dom.showObjectCard.appendChild(dom.showHydrantsLabel);
	dom.showObjectCard.appendChild(document.createElement("br"));

	dom.showUnknownHydrants = document.createElement("input");
	dom.showUnknownHydrants.setAttribute("id", "show-unknown-hydrants");
	dom.showUnknownHydrants.setAttribute("name", "show-unknown-hydrants");
	dom.showUnknownHydrants.setAttribute("type", "checkbox");
	dom.showUnknownHydrants.addEventListener("change", function(evt) {
		const toMap = evt.currentTarget.checked ? tool.map : null;

		for (const key in place.hydrant)
		{
			const hObj = place.hydrant[key];

			switch (hObj.type)
			{
				case 1:
				case 2:
				case 3:
					break;
				default:
					hObj.marker.setMap(toMap);
					break;
			}
		}

		focusMarker();
	});
	dom.showUnknownHydrantsLabel = document.createElement("label");
	dom.showUnknownHydrantsLabel.setAttribute("for", "show-unknown-hydrants");
	dom.showUnknownHydrantsLabel.innerText = "未知消防栓";
	dom.showObjectCard.appendChild(dom.showUnknownHydrants);
	dom.showObjectCard.appendChild(dom.showUnknownHydrantsLabel);
	dom.showObjectCard.appendChild(document.createElement("br"));

	dom.showPorts = document.createElement("input");
	dom.showPorts.setAttribute("id", "show-ports");
	dom.showPorts.setAttribute("name", "show-ports");
	dom.showPorts.setAttribute("type", "checkbox");
	dom.showPorts.addEventListener("change", function(evt) {
		const toMap = evt.currentTarget.checked ? tool.map : null;

		for (const key in place.port)
		{
			place.port[key].marker.setMap(toMap);
		}

		focusMarker();
	});
	dom.showPortsLabel = document.createElement("label");
	dom.showPortsLabel.setAttribute("for", "show-ports");
	dom.showPortsLabel.innerText = "碼頭";
	dom.showObjectCard.appendChild(dom.showPorts);
	dom.showObjectCard.appendChild(dom.showPortsLabel);
	dom.showObjectCard.appendChild(document.createElement("br"));

	dom.showBusinessPOI = document.createElement("input");
	dom.showBusinessPOI.setAttribute("id", "show-business-poi");
	dom.showBusinessPOI.setAttribute("name", "show-business-poi");
	dom.showBusinessPOI.setAttribute("type", "checkbox");
	dom.showBusinessPOI.addEventListener("change", function(evt) {
		if (evt.currentTarget.checked)
		{
			tool.map.setOptions({ styles: tool.mapStyles.origin });
		}
		else
		{
			tool.map.setOptions({ styles: tool.mapStyles.hide });
		}
	});
	dom.showBusinessLabel = document.createElement("label");
	dom.showBusinessLabel.setAttribute("for", "show-business-poi");
	dom.showBusinessLabel.innerText = "Google Business POI";
	dom.showObjectCard.appendChild(dom.showBusinessPOI);
	dom.showObjectCard.appendChild(dom.showBusinessLabel);

	tool.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(dom.signin);
	tool.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(dom.showObject);
	tool.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(dom.showObjectCard);
}

function initListener()
{
}

function initService()
{
	tool.directionsService = new google.maps.DirectionsService();
	tool.directionsRenderer = new google.maps.DirectionsRenderer();

	tool.placeService = new google.maps.places.PlacesService(tool.map);
}

function initSearch()
{
	const searchClient = algoliasearch("NIK987CTNK", "a8aab3b32367c64a001aab5b5be7c988");

	const search = instantsearch({
		indexName: "places",
		searchClient
	});

	const renderSearchBox = function(renderOptions, isFirstRendering) {
		const {query, refine, clear, isSearchStalled, widgetParams} = renderOptions;

		if (isFirstRendering) {
			dom.searchInput.addEventListener("input", function(evt) {
				// Reference: https://www.algolia.com/doc/guides/building-search-ui/going-further/improve-performance/js/#debouncing
				clearTimeout(dashboard.searchTimerID);
				dashboard.searchTimerID = setTimeout(function() {
					refine(evt.target.value);
				}, 500);
			});
		}

		//dom.searchInput.value = query;
	};

	const searchBox = instantsearch.connectors.connectSearchBox(renderSearchBox);

	const renderHits = function(renderOptions, isFirstRendering) {
		const {hits, widgetParams} = renderOptions;

		dashboard.searchValue = dom.searchInput.value;
		dom.searchList.textContent = null;

		hits.forEach(function(item) {
			if (item.name === dom.searchInput.value) {
				return;
			}

			const itemNode = document.createElement("option");

			itemNode.setAttribute("class", "search-element");
			itemNode.setAttribute("data-category", item.category);
			itemNode.setAttribute("data-key", item.objectID);
			itemNode.innerHTML = instantsearch.highlight({attribute: "name", hit: item});
			itemNode.onclick = function(evt) {
				dom.searchList.style.display = "none";
				dom.searchInput.value = item.name;
				dom.searchInput.dispatchEvent(new Event("input"));

				setSingleSearchMarker(item.category, item.objectID);
			};

			dom.searchList.appendChild(itemNode);
		});

		if (hits.length > 5) {
			dom.searchList.style.height = "110px";
		}
		else {
			dom.searchList.style.height = dom.searchList.childNodes.length * 22 + "px";
		}

		dashboard.searchIndex = dom.searchList.childNodes.length;
	};

	const hits = instantsearch.connectors.connectHits(renderHits);

	search.addWidgets([
		searchBox({container: dom.searchBox}),
		hits({container: dom.hits})
	]);

	search.start();
}

function initPrecinct()
{
	const precinctCoordinates = [
		{ lat: 24.205486, lng: 120.487850 },
		{ lat: 24.205721, lng: 120.488558 },
		{ lat: 24.214136, lng: 120.492399 },
		{ lat: 24.213673, lng: 120.493560 },
		{ lat: 24.221904, lng: 120.499035 },
		{ lat: 24.231613, lng: 120.503850 },
		{ lat: 24.229836, lng: 120.511527 },
		{ lat: 24.229830, lng: 120.513952 },
		{ lat: 24.287761, lng: 120.538899 },
		{ lat: 24.289332, lng: 120.540068 },
		{ lat: 24.292534, lng: 120.543652 },
		{ lat: 24.294877, lng: 120.544812 },
		{ lat: 24.294945, lng: 120.544666 },
		{ lat: 24.293639, lng: 120.543921 },
		{ lat: 24.294343, lng: 120.542308 },
		{ lat: 24.299306, lng: 120.545057 },
		{ lat: 24.304480, lng: 120.545141 },
		{ lat: 24.313686, lng: 120.527617 }
	];

	const precinctPath = new google.maps.Polyline({
		path: precinctCoordinates,
		geodesic: true,
		strokeColor: "#FF0000",
		strokeOpacity: 1.0,
		strokeWeight: 2
	});

	precinctPath.setMap(tool.map);
}

function setAddPlaceContent()
{
	tool.infoWindow.setContent(dom.newPlace.infoContainer);
}

function watchAuth()
{
	// Reference: https://github.com/firebase/firebaseui-web
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			dashboard.userInfo.user = user;
			link.uRef.child(user.uid).on("value", function(uPermission) {
				dashboard.userInfo.permission = uPermission.val();
			});
			user.getIdToken().then(function(accessToken) {
				dom.signin.innerHTML = "<i class=\"fas fa-sign-out-alt\"></i>";
				dom.signin.title = "Click to sign out";
			});
		}
		else {
			dashboard.userInfo.user = null;
			dashboard.userInfo.permission = {
				Company: {
					Read: false,
					Write: false
				},
				Hydrant: {
					Read: true,
					Write: false
				},
				Index: {
					Read: true,
					Write: false
				},
				Port: {
					Read: true,
					Write: false
				}
			};
			dom.signin.innerHTML = "<i class=\"fas fa-sign-in-alt\"></i>";
			dom.signin.title = "Click to sign in";

			dom.company.appendixDiv.style.display = "none";
			dom.company.remarkDiv.style.display = "none";
			dom.company.editBtn.style.display = "none";
			dom.company.deleteBtn.style.display = "none";
		}
	}, function(error) {
		console.log(error);
	});
}

function watchMapClick()
{
	dom.newPlace = new Object();
	dom.newPlace.infoContainer = document.createElement("div");
	dom.newPlace.addHydrantBtn = document.createElement("button");
	dom.newPlace.addHydrantBtn.innerText = "消防栓";

	dom.newPlace.infoContainer.appendChild(document.createTextNode("新增:"));
	dom.newPlace.infoContainer.appendChild(document.createElement("br"));
	dom.newPlace.infoContainer.appendChild(dom.newPlace.addHydrantBtn);

	tool.map.addListener("click", function(evt) {
		const placeID = evt.placeId;

		tool.tmpPlace.marker.setMap(null);
		unfocusMarker();

		if (dashboard.userInfo.user == null)
		{
			return;
		}

		if (dashboard.userInfo.permission.Company.Write == false)
		{
			return;
		}

		evt.stop();

		if (placeID)
		{
			const req = new Object();
			const updates = new Object();

			req["placeId"] = placeID;
			req["fields"] = [
				"address_component",
				"adr_address",
				"business_status",
				"formatted_address",
				"geometry.viewport",
				"geometry.location",
				"icon",
				"name",
				"photos",
				"place_id",
				"plus_code",
				"type",
				"url",
				"utc_offset_minutes",
				"vicinity"
			];

			tool.placeService.getDetails(req, function(gPlace, retStatus) {
				if (retStatus === google.maps.places.PlacesServiceStatus.OK)
				{
					if (place.company[placeID])
					{
					}
					else
					{
						const confirmResult = confirm("Add to database?");

						if (confirmResult) {
							updates["Name"] = gPlace.name;
							updates["Position"] = {
								WGS_X: gPlace.geometry.location.lng(),
								WGS_Y: gPlace.geometry.location.lat()
							};

							link.cRef.child(placeID).set(updates).catch(function(err) {
								alert(err);
							});
						}
					}
				}
			});
		}
		else
		{
			dom.newPlace.addHydrantBtn.disabled = false;
			dom.newPlace.addHydrantBtn.onclick = function() {
				const updates = new Object();
				let newHydrantRef = link.hRef.push();

				dom.newPlace.addHydrantBtn.disabled = true;

				updates.Position = {
					WGS_X: evt.latLng.lng(),
					WGS_Y: evt.latLng.lat()
				};

				while (place.hydrant[newHydrantRef.key])
				{
					newHydrantRef = link.hRef.push();
				}

				tool.tmpPlace.key = newHydrantRef.key;
				newHydrantRef.set(updates);
			};

			tool.tmpPlace.marker.setPosition(evt.latLng);
			tool.tmpPlace.marker.setMap(tool.map);

			setAddPlaceContent();

			tool.infoWindow.open(tool.map, tool.tmpPlace.marker);
		}
	});
}

function watchMapZoom()
{
	tool.map.addListener("zoom_changed", function() {
		const newShowIcon = new Object();
		const newIconSize = new Object();
		const newLabelSize = new Object();

		dashboard.zoomLV = tool.map.getZoom();
		//console.log("Zoom: " + dashboard.zoomLV);

		newShowIcon.company = (dashboard.zoomLV >= 13) ? true : false;
		newShowIcon.hydrant = (dashboard.zoomLV >= 16) ? true : false;
		newShowIcon.port = (dashboard.zoomLV >= 13) ? true : false;

		newIconSize.company = tool.icon.company.size[dashboard.zoomLV];
		newIconSize.port = tool.icon.port.size[dashboard.zoomLV];
		//console.log("Size: " + newIconSize.port);
		newLabelSize.port = tool.label.port.size[dashboard.zoomLV];
		//console.log("Size: " + newLabelSize.port);

		if (dashboard.showIcon.company != newShowIcon.company)
		{
			dashboard.showIcon.company = newShowIcon.company;

			for (const key in place.company)
			{
				place.company[key].marker.setVisible(newShowIcon.port);
			}
		}

		if (dashboard.showIcon.hydrant != newShowIcon.hydrant)
		{
			dashboard.showIcon.hydrant = newShowIcon.hydrant;

			for (const key in place.hydrant)
			{
				place.hydrant[key].marker.setVisible(newShowIcon.hydrant);
			}
		}

		if (dashboard.showIcon.port != newShowIcon.port)
		{
			dashboard.showIcon.port = newShowIcon.port;

			for (const key in place.port)
			{
				place.port[key].marker.setVisible(newShowIcon.port);
			}
		}

		if (dashboard.iconSize.company != newIconSize.company)
		{
			dashboard.iconSize.company = newIconSize.company;
			tool.icon.company.icon.size = new google.maps.Size(newIconSize.company, newIconSize.company);
			tool.icon.company.icon.scaledSize = new google.maps.Size(newIconSize.company, newIconSize.company);
			tool.icon.company.icon.anchor = new google.maps.Point(newIconSize.company/2, newIconSize.company/2);
			tool.icon.company.icon.labelOrigin = new google.maps.Point(newIconSize.company/2, -(newIconSize.company/2+1));

			for (const key in place.company)
			{
				place.company[key].marker.setIcon(tool.icon.company.icon);
			}
		}

		if (dashboard.iconSize.port != newIconSize.port)
		{
			dashboard.iconSize.port = newIconSize.port;
			tool.icon.port.icon.size = new google.maps.Size(newIconSize.port, newIconSize.port);
			tool.icon.port.icon.scaledSize = new google.maps.Size(newIconSize.port, newIconSize.port);
			tool.icon.port.icon.anchor = new google.maps.Point(newIconSize.port/2, newIconSize.port/2);
			tool.icon.port.icon.labelOrigin = new google.maps.Point(newIconSize.port/2, -(newIconSize.port/2+1));

			for (const key in place.port)
			{
				place.port[key].marker.setIcon(tool.icon.port.icon);
			}
		}

		/*
		if (dashboard.labelSize.port != newLabelSize.port)
		{
			dashboard.labelSize.port = newLabelSize.port;

			for (const key in place.port)
			{
				const pLabel = place.port[key].marker.getLabel();

				console.log(pLabel);

				pLabel.fontSize = newLabelSize.port.toString() + "px";
				place.port[key].marker.setLabel(pLabel);

				console.log(pLabel);
			}
		}
		*/

		focusMarker();
	});
}


// Company

function initCompanies()
{
	place.company = new Object();

	tool.icon.company = new Object();
	tool.icon.company.icon = new Object();
	tool.icon.company.icon.url = "./Icon/buildings-24.png";

	tool.icon.company.size = [
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 8, 16, 24, 24, 24, 24, 24,
		24, 24, 24
	];

	dashboard.iconSize.company = tool.icon.company.size[dashboard.zoomLV];
	dashboard.showIcon.company = false;
	tool.icon.company.icon.size = new google.maps.Size(dashboard.iconSize.company, dashboard.iconSize.company);
	tool.icon.company.icon.scaledSize = new google.maps.Size(dashboard.iconSize.company, dashboard.iconSize.company);
	tool.icon.company.icon.anchor = new google.maps.Point(dashboard.iconSize.company/2, dashboard.iconSize.company/2);
	tool.icon.company.icon.labelOrigin = new google.maps.Point(dashboard.iconSize.company/2, -(dashboard.iconSize.company/2+1));

	//dashboard.iconSize.company = 6;

	dom.showCompanies.setAttribute("checked", "checked");

	link.cIndex.on("child_added", function(cIdx) {
		const cKey = cIdx.key;
		const cObj = new Object();

		place.company[cKey] = cObj;

		cObj.appendix = new Object();

		cObj.marker = new google.maps.Marker();
		cObj.marker.setDraggable(false);
		cObj.marker.setIcon(tool.icon.company.icon);
		cObj.marker.setMap(tool.map);
		cObj.marker.setVisible(dashboard.showIcon.company);
		cObj.marker.addListener("click", function(evt) {
			if (!dashboard.focus.marker.includes(cObj.marker))
			{
				unfocusMarker();
				dashboard.focus.marker.push(cObj.marker);
				dashboard.focus.category = ["company"];
			}
			tool.tmpPlace.marker.setMap(null);
			setCompanyContent(cKey);
			tool.infoWindow.open(tool.map, this);
		});
		cObj.marker.addListener("dragend", function(evt) {
			// TODO
		});

		cObj.ref = link.cRef.child(cKey);
		cObj.ref.child("Appendix").on("child_added", function(cAppendix) {
			const cAppKey = cAppendix.key;

			cObj.appendix[cAppKey] = new Object();
			cObj.appendix[cAppKey].name = cAppendix.child("Name").val();
			cObj.appendix[cAppKey].file = cAppendix.child("File").val();
		});
		cObj.ref.child("Appendix").on("child_removed", function(cAppendix) {
			delete cObj.appendix[cAppendix.key];
		});
		/*
		cObj.ref.child("FloorPlan").on("value", function(cFP) {
			cObj.floorPlan = cFP.val();
		});
		*/
		cObj.ref.child("Name").on("value", function(cName) {
			cObj.name = cName.val();
		});
		cObj.ref.child("Position").on("value", function(cPosition) {
			cObj.position = {
				lat: cPosition.child("WGS_Y").val(),
				lng: cPosition.child("WGS_X").val()
			};
			cObj.marker.setPosition(cObj.position);
		});
		cObj.ref.child("Remark").on("value", function(cRemark) {
			cObj.remark = cRemark.val();
		});
	});

	dom.company = new Object();

	dom.company.infoContainer = document.createElement("div");
	dom.company.infoContainer.style.overflow = "auto";
	dom.company.name = document.createElement("a");
	dom.company.directionContainer = document.createElement("a");
	dom.company.direction = document.createElement("i");
	dom.company.direction.setAttribute("class", "fas fa-directions");
	/*
	dom.company.fp = document.createElement("a");
	dom.company.fp.innerText = "平面圖";
	*/
	dom.company.appendixDiv = document.createElement("div");
	dom.company.remarkDiv = document.createElement("div");
	dom.company.remark = document.createElement("a");
	dom.company.editBtn = document.createElement("button");
	dom.company.editBtn.innerText = "編輯";
	dom.company.deleteBtn = document.createElement("button");
	dom.company.deleteBtn.innerText = "刪除";

	dom.company.directionContainer.appendChild(dom.company.direction);
	//dom.company.appendixDiv.appendChild(document.createTextNode("附件:"));
	//dom.company.appendixDiv.appendChild(document.createElement("br"));
	dom.company.remarkDiv.appendChild(document.createTextNode("備註:"));
	dom.company.remarkDiv.appendChild(document.createElement("br"));
	dom.company.remarkDiv.appendChild(dom.company.remark);
	dom.company.infoContainer.appendChild(dom.company.name);
	dom.company.infoContainer.appendChild(dom.company.directionContainer);
	dom.company.infoContainer.appendChild(document.createElement("br"));
	/*
	dom.company.infoContainer.appendChild(dom.company.fp);
	dom.company.infoContainer.appendChild(document.createElement("br"));
	*/
	dom.company.infoContainer.appendChild(dom.company.appendixDiv);
	dom.company.infoContainer.appendChild(dom.company.remarkDiv);
	dom.company.infoContainer.appendChild(document.createElement("br"));
	dom.company.infoContainer.appendChild(dom.company.editBtn);
	dom.company.infoContainer.appendChild(dom.company.deleteBtn);

	dom.company.inputContainer = document.createElement("div");
	dom.company.inNameDiv = document.createElement("div");
	dom.company.inName = document.createElement("input");
	dom.company.submitBtn = document.createElement("button");
	dom.company.inRemarkDiv = document.createElement("div");
	dom.company.inRemark = document.createElement("textarea");
	dom.company.inRemark.style.borderWidth = "2px";
	dom.company.submitBtn.innerText = "確認";
	dom.company.cancelBtn = document.createElement("button");
	dom.company.cancelBtn.innerText = "取消";

	dom.company.inNameDiv.appendChild(document.createTextNode("名稱: "));
	dom.company.inNameDiv.appendChild(dom.company.inName);
	dom.company.inRemarkDiv.appendChild(document.createTextNode("備註:"));
	dom.company.inRemarkDiv.appendChild(document.createElement("br"));
	dom.company.inRemarkDiv.appendChild(dom.company.inRemark);
	dom.company.inputContainer.appendChild(dom.company.inNameDiv);
	dom.company.inputContainer.appendChild(dom.company.inRemarkDiv);
	dom.company.inputContainer.appendChild(document.createElement("br"));
	dom.company.inputContainer.appendChild(dom.company.submitBtn);
	dom.company.inputContainer.appendChild(dom.company.cancelBtn);
}

function setCompanyContent(key)
{
	const cObj = place.company[key];
	const cRemark = (cObj.remark) ? cObj.remark.split("\n") : [];

	dom.company.name.innerText = cObj.name;
	dom.company.remark.innerText = "";

	for (let i = 0; i < cRemark.length-1; i++)
	{
		dom.company.remark.appendChild(document.createTextNode(cRemark[i]));
		dom.company.remark.appendChild(document.createElement("br"));
	}
	if (cObj.remark)
	{
		dom.company.remark.appendChild(document.createTextNode(cRemark[cRemark.length-1]));
	}

	dom.company.directionContainer.onclick = function() {
		directTo(cObj.position);
	};

	//dom.company.fp.href = "https://thfd-1f24e.firebaseapp.com/floorplan.html?key=" + key;

	if (dashboard.userInfo.permission.Company.Read)
	{
		if (Object.keys(cObj.appendix).length)
		{
			dom.company.appendixDiv.style.display = "";
			dom.company.appendixDiv.innerText = "";
			dom.company.appendixDiv.appendChild(document.createTextNode("附件:"));
			dom.company.appendixDiv.appendChild(document.createElement("br"));
			for (const i in cObj.appendix)
			{
				const childAppendixDOM = document.createElement("a");
				childAppendixDOM.innerText = cObj.appendix[i].name;
				//childAppendixDOM.href = cObj.appendix[i].file;

				link.fpStorage.child(cObj.appendix[i].file).getDownloadURL().then(function(url) {
					childAppendixDOM.href = url;
				}).catch(function(err) {
					console.log(err);
				});

				dom.company.appendixDiv.appendChild(childAppendixDOM);
				dom.company.appendixDiv.appendChild(document.createElement("br"));
			}
		}
		else
		{
			dom.company.appendixDiv.style.display = "none";
		}
	}

	dom.company.editBtn.onclick = function() {
		editCompany(key);
	};

	dom.company.deleteBtn.onclick = function() {
		deleteCompany(key);
	};

	tool.infoWindow.setContent(dom.company.infoContainer);
}

function editCompany(key)
{
	const cObj = place.company[key];
	const addAppendixBtn = document.createElement("button");

	dom.company.inName.value = cObj.name;
	dom.company.inRemark.value = cObj.remark;

	dom.company.submitBtn.onclick = function() {
		submitCompany(key);
	};

	dom.company.cancelBtn.onclick = function() {
		setCompanyContent(key);
	};

	tool.infoWindow.setContent(dom.company.inputContainer);
}

function submitCompany(key)
{
	const cObj = place.company[key];
	const updates = new Object();

	updates.Name = dom.company.inName.value;
	updates.Remark = dom.company.inRemark.value;
	updates.Timestamp = firebase.database.ServerValue.TIMESTAMP;

	cObj.ref.update(updates).catch(function(err) {
		alert(err);
	});

	setCompanyContent(key);
}

function deleteCompany(key)
{
	let confirmResult = confirm("Deleted data cannot be recovered.\nAre you sure to delete?");
	if (confirmResult)
	{
		unfocusMarker();
		place.company[key].marker.setMap(null);
		place.company[key].ref.remove();
		place.company[key] = null;
	}
}


// Hydrant

function initHydrants()
{
	const hIcon = new Object();

	hIcon.circle = {
		url: "./Icon/icons8-filled-circle-24.png",
		size: new google.maps.Size(16, 16),
		scaledSize: new google.maps.Size(16, 16),
		origin: new google.maps.Point(0, 0),
		anchor: new google.maps.Point(8, 8),
		crossOnDrag: false
	};
	hIcon.square = {
		url: "./Icon/icons8-rounded-square-24.png",
		size: new google.maps.Size(16, 16),
		scaledSize: new google.maps.Size(16, 16),
		origin: new google.maps.Point(0, 0),
		anchor: new google.maps.Point(8, 8),
		crossOnDrag: false
	};
	hIcon.triangle = {
		url: "./Icon/icons8-triangle-24.png",
		size: new google.maps.Size(16, 16),
		scaledSize: new google.maps.Size(16, 16),
		origin: new google.maps.Point(0, 0),
		anchor: new google.maps.Point(8, 8),
		crossOnDrag: false
	};
	hIcon.hydrant = {
		url: "./Icon/hydrant-default-24.png",
		size: new google.maps.Size(24, 24),
		scaledSize: new google.maps.Size(24, 24),
		origin: new google.maps.Point(0, 0),
		anchor: new google.maps.Point(12, 12),
		crossOnDrag: false
	};

	place.hydrant = new Object();

	dashboard.showIcon.hydrant = false;

	dom.showHydrants.setAttribute("checked", "checked");
	//dom.showUnknownHydrants.setAttribute("checked", "checked");

	link.hIndex.on("child_added", function(hIdx) {
		const hKey = hIdx.key;
		const hObj = new Object();

		const labelOptions = new Object();
		const labelContainer = document.createElement("div");

		place.hydrant[hKey] = hObj;

		hObj.marker = new google.maps.Marker();
		hObj.marker.setOptions({
			draggable: false,
			//map: tool.map,
			map: null,
			visible: (dashboard.zoomLV >= 16) ? true : false
		});
		hObj.marker.addListener("click", function(evt) {
			if (!dashboard.focus.marker.includes(hObj.marker))
			{
				unfocusMarker();
				dashboard.focus.marker.push(hObj.marker);

				switch (hObj.type)
				{
					case 1:
					case 2:
					case 3:
						dashboard.focus.category = ["hydrant"];
						break;
					default:
						dashboard.focus.category = ["unknown-hydrant"];
						break;
				}
			}
			tool.tmpPlace.marker.setMap(null);
			setHydrantContent(hKey);
			tool.infoWindow.open(tool.map, this);
		});
		hObj.marker.addListener("dragend", function(evt) {
			// TODO
		});
		hObj.marker.addListener("mousedown", function(evt) {
			clearTimeout(this.downTimer);
			tool.map.setOptions({draggable: true});
			this.setDraggable(false);

			this.downTimer = setTimeout(function() {
				tool.map.setOptions({draggable: false});
				hObj.marker.setDraggable(true);
				dashboard.markerMoveListener = google.maps.event.addListener(tool.map, "mousemove", function(moveEvt) {
					hObj.marker.setPosition(moveEvt.latLng);
				})
				google.maps.event.addListenerOnce(tool.map, "mouseup", function(moveEvt) {
					clearTimeout(hObj.marker.downTimer);
					tool.map.setOptions({draggable: true});
					hObj.marker.setDraggable(false);
					dashboard.markerMoveListener.remove();

					// TODO: update the position of hydrant in database
					let confirmResult = confirm("You changed the location of a place.\nDo you want to save the changes?");
					if (confirmResult) {
						const updates = new Object();;
						updates.Position = {
							WGS_X: moveEvt.latLng.lng(),
							WGS_Y: moveEvt.latLng.lat()
						};
						hObj.ref.update(updates).catch(function (err) {
							hObj.marker.setPosition(hObj.position);
							alert(err);
						});
					}
					else {
						hObj.marker.setPosition(hObj.position);
					}
				});
			}, 2000);
		});
		hObj.marker.addListener("mouseup", function(evt) {
			clearTimeout(this.downTimer);
			tool.map.setOptions({draggable: true});
			this.setDraggable(false);
		});

		hObj.ref = link.hRef.child(hKey);
		hObj.ref.child("Name").on("value", function(hName) {
			hObj.name = hName.val();
		});
		hObj.ref.child("Position").on("value", function(hPosition) {
			hObj.position = {
				lat: hPosition.child("WGS_Y").val(),
				lng: hPosition.child("WGS_X").val()
			};

			if (hObj.position.lat && hObj.position.lng)
			{
				hObj.marker.setPosition(hObj.position);
			}
		});
		hObj.ref.child("Type").on("value", function(hType) {
			hObj.type = hType.val();

			switch (hObj.type) {
				case 1:
					hObj.marker.setIcon(hIcon.circle);
					hObj.marker.setMap(tool.map);
					break;
				case 2:
					hObj.marker.setIcon(hIcon.square);
					hObj.marker.setMap(tool.map);
					break;
				case 3:
					hObj.marker.setIcon(hIcon.triangle);
					hObj.marker.setMap(tool.map);
					break;
				default:
					hObj.marker.setIcon(hIcon.hydrant);
					//hObj.marker.setMap(null);
					break;
			}
		});

		if (hKey === tool.tmpPlace.key)
		{
			dashboard.focus.marker = [hObj.marker];
			focusMarker();
		}
	});

	dom.hydrant = new Object();

	dom.hydrant.infoContainer = document.createElement("div");
	dom.hydrant.name = document.createElement("a");
	dom.hydrant.typeDiv = document.createElement("div");
	dom.hydrant.type = document.createTextNode(" ");
	dom.hydrant.positionDiv = document.createElement("div");
	dom.hydrant.position = document.createElement("a");
	dom.hydrant.editBtn = document.createElement("button");
	dom.hydrant.editBtn.innerText = "編輯";
	dom.hydrant.deleteBtn = document.createElement("button");
	dom.hydrant.deleteBtn.innerText = "刪除";

	dom.hydrant.typeDiv.appendChild(document.createTextNode("類型: "));
	dom.hydrant.typeDiv.appendChild(dom.hydrant.type);
	dom.hydrant.positionDiv.appendChild(document.createTextNode("座標: "));
	dom.hydrant.positionDiv.appendChild(dom.hydrant.position);
	dom.hydrant.infoContainer.appendChild(dom.hydrant.name);
	dom.hydrant.infoContainer.appendChild(document.createElement("br"));
	dom.hydrant.infoContainer.appendChild(dom.hydrant.typeDiv);
	dom.hydrant.infoContainer.appendChild(dom.hydrant.positionDiv);
	dom.hydrant.infoContainer.appendChild(dom.hydrant.editBtn);
	dom.hydrant.infoContainer.appendChild(dom.hydrant.deleteBtn);

	dom.hydrant.inputContainer = document.createElement("div");
	dom.hydrant.inNameDiv = document.createElement("div");
	dom.hydrant.inName = document.createElement("input");
	dom.hydrant.inPositionDiv = document.createElement("div");
	dom.hydrant.inLat = document.createElement("input");
	dom.hydrant.inLng = document.createElement("input");
	dom.hydrant.inTypeDiv = document.createElement("div");
	dom.hydrant.inType = document.createElement("select");
	dom.hydrant.inType.setAttribute("id", "hydrant-type");
	dom.hydrant.tOption1 = document.createElement("option");
	dom.hydrant.tOption1.setAttribute("value", 1);
	dom.hydrant.tOption1.innerText = "雙口式消防栓";
	dom.hydrant.tOption2 = document.createElement("option");
	dom.hydrant.tOption2.setAttribute("value", 2);
	dom.hydrant.tOption2.innerText = "單口式消防栓";
	dom.hydrant.tOption3 = document.createElement("option");
	dom.hydrant.tOption3.setAttribute("value", 3);
	dom.hydrant.tOption3.innerText = "地下式消防栓";
	dom.hydrant.submitBtn = document.createElement("button");
	dom.hydrant.submitBtn.innerText = "確認";
	dom.hydrant.cancelBtn = document.createElement("button");
	dom.hydrant.cancelBtn.innerText = "取消";

	dom.hydrant.inNameDiv.appendChild(document.createTextNode("名稱: "));
	dom.hydrant.inNameDiv.appendChild(dom.hydrant.inName);
	dom.hydrant.inType.appendChild(dom.hydrant.tOption1);
	dom.hydrant.inType.appendChild(dom.hydrant.tOption2);
	dom.hydrant.inType.appendChild(dom.hydrant.tOption3);
	dom.hydrant.inTypeDiv.appendChild(document.createTextNode("類型: "));
	dom.hydrant.inTypeDiv.appendChild(dom.hydrant.inType);
	dom.hydrant.inPositionDiv.appendChild(document.createTextNode("緯度: "));
	dom.hydrant.inPositionDiv.appendChild(dom.hydrant.inLat);
	dom.hydrant.inPositionDiv.appendChild(document.createElement("br"));
	dom.hydrant.inPositionDiv.appendChild(document.createTextNode("經度: "));
	dom.hydrant.inPositionDiv.appendChild(dom.hydrant.inLng);
	dom.hydrant.inputContainer.appendChild(dom.hydrant.inNameDiv);
	dom.hydrant.inputContainer.appendChild(dom.hydrant.inTypeDiv);
	dom.hydrant.inputContainer.appendChild(dom.hydrant.inPositionDiv);
	dom.hydrant.inputContainer.appendChild(dom.hydrant.submitBtn);
	dom.hydrant.inputContainer.appendChild(dom.hydrant.cancelBtn);
}

function setHydrantContent(key)
{
	const hObj = place.hydrant[key];

	dom.hydrant.name.innerText = hObj.name;

	switch (hObj.type)
	{
		case 1:
			dom.hydrant.type.textContent = "雙口式消防栓";
			break;
		case 2:
			dom.hydrant.type.textContent = "單口式消防栓";
			break;
		case 3:
			dom.hydrant.type.textContent = "地下式消防栓";
			break;
		default:
			dom.hydrant.type.textContent = "未知";
			break;
	}

	dom.hydrant.position.innerText = hObj.position.lat.toFixed(5) + ", " + hObj.position.lng.toFixed(5);

	dom.hydrant.editBtn.onclick = function() {
		editHydrant(key);
	};

	dom.hydrant.deleteBtn.onclick = function() {
		deleteHydrant(key);
	};

	tool.infoWindow.setContent(dom.hydrant.infoContainer);
}

function editHydrant(key)
{
	const hObj = place.hydrant[key];

	dom.hydrant.inName.value = hObj.name;

	switch (hObj.type)
	{
		case 1:
			dom.hydrant.tOption1.setAttribute("selected", "selected");
			dom.hydrant.tOption2.removeAttribute("selected");
			dom.hydrant.tOption3.removeAttribute("selected");
			break;
		case 2:
			dom.hydrant.tOption1.removeAttribute("selected");
			dom.hydrant.tOption2.setAttribute("selected", "selected");
			dom.hydrant.tOption3.removeAttribute("selected");
			break;
		case 3:
			dom.hydrant.tOption1.removeAttribute("selected");
			dom.hydrant.tOption2.removeAttribute("selected");
			dom.hydrant.tOption3.setAttribute("selected", "selected");
			break;
		default:
			break;
	}

	dom.hydrant.inLat.value = hObj.position.lat;
	dom.hydrant.inLng.value = hObj.position.lng;

	dom.hydrant.submitBtn.onclick = function() {
		submitHydrant(key);
	};

	dom.hydrant.cancelBtn.onclick = function() {
		setHydrantContent(key);
	};

	tool.infoWindow.setContent(dom.hydrant.inputContainer);
}

function submitHydrant(key)
{
	const hObj = place.hydrant[key];
	const updates = new Object();

	updates.Name = dom.hydrant.inName.value;
	updates.Position = {
		WGS_X: parseFloat(dom.hydrant.inLng.value),
		WGS_Y: parseFloat(dom.hydrant.inLat.value)
	};
	updates.Timestamp = firebase.database.ServerValue.TIMESTAMP;
	updates.Type = parseInt(document.getElementById("hydrant-type").value);

	hObj.ref.update(updates, function(err) {
		if (err)
		{
			alert(err);
		}
	});

	setHydrantContent(key);
}

function deleteHydrant(key)
{
	let confirmResult = confirm("Deleted data cannot be recovered.\nAre you sure to delete?");
	if (confirmResult)
	{
		unfocusMarker();
		place.hydrant[key].marker.setMap(null);
		place.hydrant[key].ref.remove();
		delete place.hydrant[key];
	}
}


// Port

function initPorts()
{
	place.port = new Object();

	tool.icon.port = new Object();
	tool.icon.port.icon = new Object();
	tool.icon.port.icon.url = "./Icon/anchor-24.png";
	tool.icon.port.size = [
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 8, 16, 24, 24, 24, 24, 24,
		24, 24, 24
	];

	tool.label.port = new Object();
	tool.label.port.size = [
		0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 4, 12, 12, 12, 12, 12,
		12, 12, 12
	];

	dashboard.iconSize.port = tool.icon.port.size[dashboard.zoomLV];
	dashboard.showIcon.port = false;
	tool.icon.port.icon.size = new google.maps.Size(dashboard.iconSize.port, dashboard.iconSize.port);
	tool.icon.port.icon.scaledSize = new google.maps.Size(dashboard.iconSize.port, dashboard.iconSize.port);
	tool.icon.port.icon.anchor = new google.maps.Point(dashboard.iconSize.port/2, dashboard.iconSize.port/2);
	tool.icon.port.icon.labelOrigin = new google.maps.Point(dashboard.iconSize.port/2, -(dashboard.iconSize.port/2+1));

	dashboard.labelSize.port = tool.label.port.size[dashboard.zoomLV];

	dom.showPorts.setAttribute("checked", "checked");

	link.pIndex.on("child_added", function(pIdx) {
		const pKey = pIdx.key;
		const pObj = new Object();

		place.port[pKey] = pObj;

		pObj.marker = new google.maps.Marker();
		/*
		pObj.marker.setOptions({
			draggable: false,
			icon: tool.icon.port.icon,
			map: tool.map,
			optimized: false,
			visible: dashboard.showIcon.port
		});
		*/
		pObj.marker.setDraggable(false);
		pObj.marker.setIcon(tool.icon.port.icon);
		pObj.marker.setMap(tool.map);
		pObj.marker.setVisible(dashboard.showIcon.port);
		pObj.marker.addListener("click", function(evt) {
			if (!dashboard.focus.marker.includes(pObj.marker))
			{
				unfocusMarker();
				dashboard.focus.marker.push(pObj.marker);
				dashboard.focus.category = ["port"];
			}
			tool.tmpPlace.marker.setMap(null);
			setPortContent(pKey);
			tool.infoWindow.open(tool.map, this);
		});
		pObj.marker.addListener("dragend", function(evt) {
			// TODO
		});

		pObj.ref = link.pRef.child(pKey);
		pObj.ref.child("Name").on("value", function(pName) {
			const pLabel = new Object();

			pObj.name = pName.val();

			pLabel.text = pObj.name.substring(4, pObj.name.length);
			pLabel.fontSize = dashboard.labelSize.port + "px";
			pLabel.fontWeight = "bold";

			//pObj.marker.setLabel(pLabel);
		});
		pObj.ref.child("Position").on("value", function(pPosition) {
			pObj.position = {
				lat: pPosition.child("WGS_Y").val(),
				lng: pPosition.child("WGS_X").val()
			};
			pObj.marker.setPosition(pObj.position);
		});
	});

	dom.port = new Object();

	dom.port.infoContainer = document.createElement("div");
	dom.port.name = document.createElement("a");
	dom.port.editBtn = document.createElement("button");
	dom.port.editBtn.innerText = "編輯";
	dom.port.deleteBtn = document.createElement("button");
	dom.port.deleteBtn.innerText = "刪除";

	dom.port.infoContainer.appendChild(dom.port.name);
	dom.port.infoContainer.appendChild(document.createElement("br"));
	dom.port.infoContainer.appendChild(dom.port.editBtn);
	dom.port.infoContainer.appendChild(dom.port.deleteBtn);

	dom.port.inputContainer = document.createElement("div");
	dom.port.inNameDiv = document.createElement("div");
	dom.port.inName = document.createElement("input");
	dom.port.submitBtn = document.createElement("button");
	dom.port.submitBtn.innerText = "確認";
	dom.port.cancelBtn = document.createElement("button");
	dom.port.cancelBtn.innerText = "取消";

	dom.port.inNameDiv.appendChild(document.createTextNode("名稱: "));
	dom.port.inNameDiv.appendChild(dom.port.inName);
	dom.port.inputContainer.appendChild(dom.port.inNameDiv);
	dom.port.inputContainer.appendChild(document.createElement("br"));
	dom.port.inputContainer.appendChild(dom.port.submitBtn);
	dom.port.inputContainer.appendChild(dom.port.cancelBtn);
}

function setPortContent(key)
{
	const pObj = place.port[key];

	dom.port.name.innerText = pObj.name;

	dom.port.editBtn.onclick = function() {
		editPort(key);
	};

	dom.port.deleteBtn.onclick = function() {
		deletePort(key);
	};

	tool.infoWindow.setContent(dom.port.infoContainer);
}

function editPort(key)
{
	const pObj = place.port[key];

	dom.port.inName.value = pObj.name;

	dom.port.submitBtn.onclick = function() {
		submitPort(key);
	};

	dom.port.cancelBtn.onclick = function() {
		setPortContent(key);
	};

	tool.infoWindow.setContent(dom.port.inputContainer);
}

function submitPort(key)
{
	const pObj = place.port[key];
	const updates = new Object();

	updates.Name = dom.port.inName.value;
	updates.Timestamp = firebase.database.ServerValue.TIMESTAMP;

	pObj.ref.update(updates, function(err) {
		if (err)
		{
			alert(err);
		}
	});

	setPortContent(key);
}

function deletePort(key)
{
	let confirmResult = confirm("Deleted data cannot be recovered.\nAre you sure to delete?");
	if (confirmResult)
	{
		unfocusMarker();
		place.port[key].marker.setMap(null);
		place.port[key].ref.remove();
		place.port[key] = null;
	}
}


// Other functions

function addAppendix(key)
{
	const cObj = place.company[key];
	const newData = new Object();

	newData.Name = "Untitled";

	cObj.child("Appendix").push(newData);
}

function deleteSearchMarkers()
{
	for (const m of dashboard.searchMarkers)
	{
		m.setMap(null);
	}
}

function direct(srcLocation, destLocation)
{
	tool.directionsService.route(
		{
			origin: srcLocation,
			destination: destLocation,
			travelMode: google.maps.TravelMode.DRIVING
		},
		(response, resultStatus) => {
			if (resultStatus === "OK")
			{
				tool.directionsRenderer.setDirections(response);
				tool.directionsRenderer.setMap(tool.map);
			}
			else
			{
				alert("Directions request failed due to " + resultStatus);
			}
		}
	);
}

function directTo(destLocation)
{
	if (dashboard.userInfo.position == null)
	{
		getMyLocation().then(() => {
			direct(dashboard.userInfo.position, destLocation);
		});
	}
	else
	{
		direct(dashboard.userInfo.position, destLocation);
	}
}

function focusMarker()
{
	dashboard.focus.marker.forEach(function(marker) {
		marker.setMap(tool.map);
		marker.setVisible(true);
	});
}

function getMyLocation()
{
	return new Promise((resolve, reject) => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition((position) => {
				dashboard.userInfo.position = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				}
				dashboard.userInfo.marker.setPosition(dashboard.userInfo.position);
				dashboard.userInfo.marker.setMap(tool.map);
				tool.map.panTo(dashboard.userInfo.position);
				resolve();
			});

			navigator.geolocation.watchPosition((position) => {
				dashboard.userInfo.position = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				}
				dashboard.userInfo.marker.setPosition(dashboard.userInfo.position);
			});
		}
		else {
			console.log("Your brower does not support the navigator.geolocation.");
			dashboard.userInfo.marker.setMap(null);
			reject();
		}
	});
}

function setSingleSearchMarker(category, key)
{
	const newSearchMarker = new google.maps.Marker();
	let mPosition;

	switch (category)
	{
		case "Company":
			mPosition = place.company[key].position;
			break;
		case "Hydrant":
			mPosition = place.hydrant[key].position;
			break;
		case "Port":
			mPosition = place.port[key].position;
			break;
		default:
			break;
	}

	newSearchMarker.setPosition(mPosition);
	newSearchMarker.setMap(tool.map);
	deleteSearchMarkers();
	dashboard.searchMarkers = [newSearchMarker];
	tool.map.panTo(mPosition);
}

function signIn()
{
	if (dashboard.userInfo.user) {
		firebase.auth().signOut().then(function() {
		}).catch(function(error) {
			console.log(error);
		});
	}
	else {
		window.location.href = "https://thfd-1f24e.firebaseapp.com/login.html";
	}
}

function sleep(ms)
{
	return new Promise(resolve => setTimeout(resolve, ms));
}

function toggleShow(dObj)
{
	if (dObj.style.display == "none")
	{
		dObj.style.display = "inline-block";
	}
	else
	{
		dObj.style.display = "none";
	}
}

function unfocusMarker()
{
	for (let i = 0; i < dashboard.focus.marker.length; i++)
	{
		switch (dashboard.focus.category[i])
		{
			case "company":
				break;
			case "hydrant":
				if (dashboard.zoomLV < 16)
				{
					dashboard.focus.marker[i].setVisible(false);
				}
				if (!dom.showHydrants.checked)
				{
					dashboard.focus.marker[i].setMap(null);
				}
				break;
			case "unknown-hydrant":
				if (dashboard.zoomLV < 16)
				{
					dashboard.focus.marker[i].setVisible(false);
				}
				if (!dom.showUnknownHydrants.checked)
				{
					dashboard.focus.marker[i].setMap(null);
				}
				break;
			case "port":
				break;
			default:
				break;
		}
	}

	dashboard.focus.marker = [];
}
