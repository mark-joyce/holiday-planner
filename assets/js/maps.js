let countryRestrict;
let autocomplete;
let map, places, infoWindow;
let options = {
    'hotel': {
        types: ['lodging']
    },
    'restaurant': {
        types: ['restaurant', 'bar', 'cafe']
    },
    'attraction': {
        types: ['museum', 'art_gallery', 'park', 'amusement_park']
    }
};
let countries = {
    'default': {
        center: { lat: 45.4, lng: 0 },
        zoom: 2.9
    },
    'au': {
        center: { lat: -25.3, lng: 133.8 },
        zoom: 4
    },
    'br': {
        center: { lat: -14.2, lng: -51.9 },
        zoom: 4
    },
    'ca': {
        center: { lat: 62, lng: -110.0 },
        zoom: 3.5
    },
    'eg': {
        center: { lat: 26.2, lng: 30.3 },
        zoom: 6
    },
    'gr': {
        center: { lat: 39.2, lng: 22.5 },
        zoom: 6.5
    },
    'mx': {
        center: { lat: 23.6, lng: -102.5 },
        zoom: 5
    },
    'nz': {
        center: { lat: -40.9, lng: 174.9 },
        zoom: 5.5
    },
    'it': {
        center: { lat: 41.9, lng: 12.6 },
        zoom: 6
    },
    'za': {
        center: { lat: -30.6, lng: 22.9 },
        zoom: 5
    },
    'es': {
        center: { lat: 40.5, lng: -3.7 },
        zoom: 6
    },
    'tr': {
        center: { lat: 39.2, lng: 35.5 },
        zoom: 6
    },
    'us': {
        center: { lat: 37.1, lng: -95.7 },
        zoom: 4.5
    }
};
let markers = [];
let MARKER_PATH = 'https://developers.google.com/maps/documentation/javascript/images/marker_green';
let hostnameRegexp = new RegExp('^https?://.+?/');

// Spinner show method

/**
 * This is jQuery method that activates the overlay div containing spinner
 * This was implemented so the user can see the loading spinner instead of empty space while the map is loading
 */
$("#overlay").show();

// MAP INIT

/**
 * Function initiating google map API
 * Function contains event listeners that monitor changes in filters
 */
 
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: countries['default'].zoom,
        center: countries['default'].center,
        mapTypeControl: false,
        panControl: false,
        zoomControl: false,
        streetViewControl: false,
        mapTypeId: 'roadmap',
        styles: [{
                "featureType": "road.highway",
                "elementType": "geometry.fill",
                "stylers": [{
                    "color": "#fbeec1"
                }]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#659dbd"
                }]
            }
        ]

    });

    infoWindow = new google.maps.InfoWindow({
        content: document.getElementById('info-content')
    });

    // Spinner hide method

    /**
     * This is jQuery method that hides the overlay div containing spinner
     * When map is loaded spinner with overlay will be hidden
     */

    $("#overlay").hide();

    // EVENT LISTENERS

    // Autocomplete window

    /**
     * Create the autocomplete object and associate it with the UI input control.
     * Restrict the search to the default country, and to place type "cities".
     */

    autocomplete = new google.maps.places.Autocomplete(
        (document.getElementById('city-input')), {
            types: ['(cities)'],
            componentRestrictions: countryRestrict
        });
    places = new google.maps.places.PlacesService(map);

    autocomplete.addListener('place_changed', onPlaceChanged);

    // Place type select menu

    /**
     * Add a DOM event listener to react when the user selects a place type.
     */

    document.getElementById('place-type').addEventListener('change', typeWithoutPlace);

    // Country select menu

    /**
     * Add a DOM event listener to react when the user selects a country.
     */

    document.getElementById('country').addEventListener('change', setAutocompleteCountry);

    // Reset button

    /**
     * Add a DOM event listener to react when the user clicks the reset button.
     */

    document.getElementById('reset-button').addEventListener('click', resetButton);

}

// MISING INFORMATION ALERTS

// Function checking missing information about location

/**
 * Function added to avoid dropping markers if location (city) is not specified
 * Function pops-up an alert saying that city has to be specified first
 * If city is specified lintener will call search function
 */

function typeWithoutPlace() {
    let city = document.getElementById('city-input').value;
    let countrySelect = document.getElementById('country').value;

    if (countrySelect == 'default' && city == '') {
        Swal.fire('Information missing', 'Please select a country and enter a city name first!', 'info');
        clearPlaceTypeSelection();
    }
    else if (countrySelect != 'default' && city == '') {
        Swal.fire('Information missing', 'Please enter a city name first!', 'info');
        clearPlaceTypeSelection();
    }
    else {
        search();
    }
}

// CITY FILTER

// Zoom to specified city

/**
 * When the user selects a city, get the place details for the city and
 * zoom the map in on the city.
 */

function onPlaceChanged() {
    let place = autocomplete.getPlace();
    if (place.geometry) {
        map.panTo(place.geometry.location);
        map.setZoom(15);
        onDefaultType();
    }
}

// PLACE TYPE FILTER

// Check if place type is selected

/**
 * Function that checks if default value of place type (placeholder) is selected
 * if yes it does nothing
 * when one of valid options is selected it calls the search() function
 */

function onDefaultType() {
    let option = document.getElementById('place-type').value;
    if (option != 'default') {
        search();
    }
}

// SEARCH FUNCTION

// Search for place within specified types

/**
 * Search for place in the selected city, within the viewport of the map.
 */

function search() {
    let option = document.getElementById('place-type').value;
    let search = {
        bounds: map.getBounds(),
        types: options[option].types
    };


    places.nearbySearch(search, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            clearResults();
            clearMarkers();
            
            // Add heading for the results table
            
            document.getElementById('results-heading').innerHTML = "Results";
            
            // Create a marker for each place (accommodation/restaurant/attraction) found, and
            // assign a letter of the alphabetic to each marker icon.
            
            for (let i = 0; i < results.length; i++) {
                let markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
                let markerIcon = MARKER_PATH + markerLetter + '.png';
                
                // Use marker animation to drop the icons incrementally on the map.
                
                markers[i] = new google.maps.Marker({
                    position: results[i].geometry.location,
                    animation: google.maps.Animation.DROP,
                    icon: markerIcon
                });
                
                // If the user clicks a marker, show the details of that place option
                // in an info window.
                
                markers[i].placeResult = results[i];
                google.maps.event.addListener(markers[i], 'click', showInfoWindow);
                setTimeout(dropMarker(i), i * 100);
                addResult(results[i], i);
            }
        }
    });
}

// CLEAR MARKER

// Clear markers function

/**
 * Function clears markers displayed on the map
 */

function clearMarkers() {
    for (let i = 0; i < markers.length; i++) {
        if (markers[i]) {
            markers[i].setMap(null);
        }
    }
    markers = [];
}

// COUNTRY

// Country restriction function

/** Set the country restriction based on user input.
 * Also center and zoom the map on the given country.
 */

function setAutocompleteCountry() {

    let country = document.getElementById('country').value;
    autocomplete.setComponentRestrictions({ 'country': country });
    map.setCenter(countries[country].center);
    map.setZoom(countries[country].zoom);

    clearResults();
    clearMarkers();
    clearAutocomplete();
    clearPlaceTypeSelection();

}

// DROP MARKERS

// Function dropping markers

function dropMarker(i) {
    return function() {
        markers[i].setMap(map);
    };
}

// RESULTS TABLE

// Function generating results

/**
 * Function that generates a table with results besed on specified filters
 * Table displays marker, place name and address
 */

function addResult(result, i) {
    let results = document.getElementById('results');
    let markerLetter = String.fromCharCode('A'.charCodeAt(0) + (i % 26));
    let markerIcon = MARKER_PATH + markerLetter + '.png';

    let tr = document.createElement('tr');
    tr.style.backgroundColor = (i % 2 === 0 ? '#272727' : '#464646');
    tr.onclick = function() {
        google.maps.event.trigger(markers[i], 'click');
    };

    let iconTd = document.createElement('td');
    let nameTd = document.createElement('td');
    let addressTd = document.createElement('td');
    let icon = document.createElement('img');
    icon.src = markerIcon;
    icon.setAttribute('class', 'placeIcon');
    icon.setAttribute('className', 'placeIcon');
    let name = document.createTextNode(result.name);
    let address = document.createTextNode(result.vicinity);
    iconTd.appendChild(icon);
    nameTd.appendChild(name);
    addressTd.appendChild(address);
    tr.appendChild(iconTd);
    tr.appendChild(nameTd);
    tr.appendChild(addressTd);

    results.appendChild(tr);
}

// Function clearing results

/**
 * Function that removes the results from the results table
 */

function clearResults() {
    let results = document.getElementById('results');
    while (results.childNodes[0]) {
        results.removeChild(results.childNodes[0]);
    }
}

// INFORMATION WINDOW

// Function generating information window

/**
 * Get the place details. Show the information in an info window,
 * anchored on the marker for the place that the user selected.
 */

function showInfoWindow() {
    let marker = this;
    places.getDetails({ placeId: marker.placeResult.place_id },
        function(place, status) {
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
                return;
            }
            infoWindow.open(map, marker);
            buildIWContent(place);
        });
}

// Function that adds information into the information wiindow

/**
 * Load the place information into the HTML elements used by the info window.
 */

function buildIWContent(place) {
    document.getElementById('iw-icon').innerHTML = '<img class="icon" ' +
        'src="' + place.icon + '"/>';
    document.getElementById('iw-url').innerHTML = '<b><a href="' + place.url +
        '">' + place.name + '</a></b>';
    document.getElementById('iw-address').textContent = place.vicinity;

    if (place.formatted_phone_number) {
        document.getElementById('iw-phone-row').style.display = '';
        document.getElementById('iw-phone').textContent =
            place.formatted_phone_number;
    }
    else {
        document.getElementById('iw-phone-row').style.display = 'none';
    }

    /**
     * Assign a five-star rating to the hotel / restaurant, using a yellow star ('&#11088;')
     * to indicate the rating the hotel / restaurant has earned, and a empty/outlined star ('&#9734;')
     * for the rating points not achieved.
     */

    if (place.rating) {
        let ratingHtml = '';
        for (let i = 0; i < 5; i++) {
            if (place.rating < (i + 0.5)) {
                ratingHtml += '&#9734;';
            }
            else {
                ratingHtml += '&#11088;';
            }
            document.getElementById('iw-rating-row').style.display = '';
            document.getElementById('iw-rating').innerHTML = ratingHtml;
        }
    }
    else {
        document.getElementById('iw-rating-row').style.display = 'none';
    }

    /**
     * The regexp isolates the first part of the URL (domain plus subdomain)
     * to give a short URL for displaying in the info window.
     */

    if (place.website) {
        let fullUrl = place.website;
        let website = hostnameRegexp.exec(place.website);
        if (website === null) {
            website = 'http://' + place.website + '/';
            fullUrl = website;
        }
        document.getElementById('iw-website-row').style.display = '';
        document.getElementById('iw-website').textContent = website;
    }
    else {
        document.getElementById('iw-website-row').style.display = 'none';
    }
}

// RESET

// Reset functions

/**
 * Functions supporting the reset process
 * Functions clear autocomplete and sets select menus to the default settings
 */

function clearAutocomplete() {
    document.getElementById('city-input').value = '';
}

function clearCoutrySelection() {
    document.getElementById('country').value = 'default';
}

function clearPlaceTypeSelection() {
    document.getElementById('place-type').value = 'default';
}

// Function activated on reset button

/**
 * Function to reset all settings applied
 * On reset button click all filters will return to their default settings
 * Autocomplete field and all markers and results will be cleared
 * Map will be initiated again
 */
function resetButton() {
    clearMarkers();
    clearResults();
    clearAutocomplete();
    clearCoutrySelection();
    clearPlaceTypeSelection();
    $('#results-heading').empty();
    initMap();
}
