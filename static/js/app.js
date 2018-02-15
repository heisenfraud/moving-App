/* ======= Global Variables ======*/
var map;
var largeInfowindow;
var bounds;
/* ======= Google Map ======= */
// Function to initilize map.
function initMap() {
  // Create mapElem
  this.mapElem = document.getElementById("map");
  // Create initial infowdinow variable
  largeInfowindow = new google.maps.InfoWindow();
  // Create initial bounds variable
  bounds = new google.maps.LatLngBounds();
  markers = [];
  map = new google.maps.Map(this.mapElem, {
    center: {lat: 42.2683199, lng: -71.8174296},
    zoom: 13
  });

  ko.applyBindings(new viewModel());
}

/* ======= ViewModel ======= */
var viewModel = function() {

  /*==== Variables ====*/

  var self = this;
  var markers = [];

  /*==== ko observables ====*/

  // Create ko observable for search input.
  self.searchLocation = ko.observable();
  // Create ko observable boolean for search panel visibility.
  self.showSearchPanel = ko.observable(true);
  // Create KO observable array for locatoins
  self.locationList = ko.observableArray([]);
  // Go through locations array and create a observable array.
  locationsData.forEach(function(location) {
    self.locationList.push({name: location.title, id: location.id});
  });
  // Create ko observable for checking if item is selected.
  self.itemSelected = ko.observable(false);
  // Create ko observable for filter button text.
  self.filterButtonText = ko.observable("Filter");
  // Create ko observable for searchpanebutton.
  self.searchPaneButtonTitle = ko.observable("Hide Search Pane");
  // Create ko obervable for filter button.
  self.filterButtonTitle = ko.observable("Filter Search");

  /*==== Create Markers ====*/

 // Create markers function.  This will be run through a loop to create the markers.
  function createMarkers(i) {
    // Get postion from locaton var
    var position = locationsData[i].location;
    // Get title from locaton var
    var title = locationsData[i].title;
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      id: i
    });
    // Create onlick event for your marker to change animation, open infowindow and hightlight list item.
    marker.addListener("click", function() {
      populateInfoWindow(this, largeInfowindow);
      toggleBounce(this);
      for (i = 0; i < self.locationList().length; i++) {
        if (self.locationList()[i].name === marker.title) {
          self.listItemSelected(self.locationList()[i]);
        }
      }
    });
    // Push the markers to the map.
    markers.push(marker);
    // Extend the bounds with each marker.
    bounds.extend(markers[i].position);
  }
  // Loop to create markers.
  for (var i = 0; i < self.locationList().length; i++) {
    createMarkers(i);
  }
  // Fit the bounds.
  map.fitBounds(bounds);

  /*==== KO Functions ====*/

  // Toggle pane function
  self.toggleSearchPane = function() {
    if (self.showSearchPanel()) {
      self.showSearchPanel(false);
      self.searchPaneButtonTitle("Show Search Pane");
    } else {
      self.showSearchPanel(true);
      self.searchPaneButtonTitle("Hide Search Pane");
    }
  };
  // Filter search function
  self.filterResetSearch = function() {
    // Check the value of the button.
    if (self.filterButtonText() == "Filter") {
      var listLength = self.locationList().length;
      // Check to see if anything has been entered into the search field.
      if (self.searchLocation() === null) {
        // Alert user that nothing was empty.
        alert("Search field is empty.  Please enter search query.");
      } else {
        // Loop through location list to see if they match your search query.
        for (a = listLength; a > 0; a--) {
          var searchQuery = self.searchLocation().toLowerCase();
          var listLocation = self.locationList()[a -1].name.toLowerCase();
          var markerSearch = markers[a - 1].title.toLowerCase();
          // If search query matches on one of the locations add it to your search array.
          if (listLocation.indexOf(searchQuery) == -1) {
            self.locationList.remove(self.locationList()[a - 1]);
          }
          // Check each marker to see if they match search query.
          if (markerSearch.indexOf(searchQuery) == -1) {
            markers[a - 1].setMap(null);
          }
        }
        // hide filter button
        self.filterButtonText("Reset");
        self.filterButtonTitle("Reset Search");
      }
    } else {
      // Empty location list.
      self.locationList([]);
      // Re add items to locations list array.
      locationsData.forEach(function(location) {
        self.locationList.push({name: location.title, id: location.id});
      });
      self.filterButtonText("Filter");
      self.filterButtonTitle("Filter Search");
      self.searchLocation(null);
      // Add markers back to map.
      for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
      }
      // Reset the bounds
      map.fitBounds(bounds);
    }
  };
  // Select marker function
  self.listItemSelected = function(location) {
    // Set all list items to background color black.
    $("li.locationListItems").css("background-color", "black");
    // Set the selected list item to the color grey.
    $("#" + location.id).css("background-color", "grey");
    // Search through markers to which one matches location clicked.
    for (i = 0; i < markers.length; i++) {
      // Run populate info window and toggle boucnce with marker that matches locaiton.
      if (location.name ==  markers[i].title) {
        if (markers[i].getAnimation() === null) {
          populateInfoWindow(markers[i], largeInfowindow);
          toggleBounce(markers[i]);
        }
      }
    }
  };

  /*==== Google maps functions ====*/

  // Function to add info windows.
    function populateInfoWindow(marker, infowindow) {
      // This function gets the street view panaorma of each marker and adds
      // it to the infowinow.
      function getFoursqurePicture(marker) {
        // Get Location title fropm clicked marker.
        var locationPictureSearch = marker.title;
        // Get Location latlng fropm clicked marker.
        var latLng = marker.position.lat() + "," + marker.position.lng();
        var fourSquareClientId = "KNCUUURDLALARYLELMI4ZNRGOLPX44XYMPCOWRTWWOVDN4WA";
        var fourSquareClientSecret = "YOEN04J05A1VH4JIGUBUGSWOGYMOEK4PGIOEXHRSA43VSIAC";
        // Create foursqure url to send.
        var fourSquareUrl = (`https://api.foursquare.com/v2/venues/search?limit=1&query=&
          ${locationPictureSearch} &near= ${latLng} &client_id=
          ${fourSquareClientId} &client_secret= ${fourSquareClientSecret}
          &v=20180212`);
        // Ajax request to get venue ID. This will be used to get a photo.
        $.getJSON(fourSquareUrl)
          // Function run if ajax request succeeds searching for venue ID.
          .done(function(data) {
            // Check that the repsonse from sever is OK.
            if (data.meta.code == 200) {
              // Check that server found any matches to your GET request.
              if (data.response.venues.length > 0) {
                // Get the venue ID from the response.
                var venueID = data.response.venues[0].id;
                // Create new URL for the photo request.
                var fourSquarePictureUrl = (`https://api.foursquare.com/v2/venues/`+
                  `${venueID}/photos?limit=1&client_id=${fourSquareClientId}` +
                  `&client_secret=${fourSquareClientSecret}&v=20180212`);
                  // Second ajax will use Venue ID from first ajax request to get pictures.
                  $.getJSON(fourSquarePictureUrl)
                    // Function run if ajax request succeeds searching for venue photo.
                    .done(function(data) {
                      // Check that 200 code was received.
                      if (data.meta.code == 200) {
                        // Check to see if any photos were returned from server
                        if (data.response.photos.count > 0) {
                          // Get the photo array.
                          var photoData = data.response.photos.items[0];
                          // Get the prefix of the photo url.
                          var urlPrefix = photoData.prefix;
                          // Get the suffix of the photo url.
                          var urlSuffix = photoData.suffix;
                          // crete the photo uRL using the prefix, suffix and adding a picture size.
                          var photoURL = (urlPrefix + "150x150" + urlSuffix);
                          // Add the photo to the infowindow alowng with title.
                          infowindow.setContent("<div><p id='infoWindowTitle'>" +
                            marker.title + "</p></div>" + "<div><img id='infoWindowPhoto' src='" +
                            photoURL +"'></div><div>Photo from Foursquare");
                        } else {
                          // If no photos are found inform user.
                          infowindow.setContent("<div class='infoWindow'>" +
                            marker.title + "</div>" + "<div>No Photo Found.</div>");
                        }
                      } else {
                        // Provide the error code to the user if there is an error contacting the server.
                        infowindow.setContent("<div>" + marker.title + "</div>" +
                          "<div>Error Retrieving Venue Photo. Error code: " +
                          data.meta.code + "</div>");
                      }
                    })
                    // Function run if ajax request fails searching for venue photo.
                    .fail(function() {
                      infowindow.setContent("<div>" + marker.title + "</div>" +
                        "<div>Ajax Error retreiving venue photo.</div>");
                    });
              } else {
              // If no venue is found at location inform user.
                infowindow.setContent("<div>" + marker.title + "</div>" +
                  "<div>Venue cannot be found on Foursquare.</div>");
              }
            } else {
              // Provide the error code to the user if there is an error contacting the server.
              infowindow.setContent("<div>" + marker.title + "</div>" +
                "<div>Error Retrieving Venue ID. Error code: " + data.meta.code +
                "</div>");
            }
          })
          // Function run if ajax request fails searching for venue ID.
          .fail(function() {
            infowindow.setContent("<div>" + marker.title + "</div>" +
              "<div>Ajax Error retreiving venue ID.</div>");
          });
      }
      // Check to make sure the infowindow is not already opened on this marker.
      if (infowindow.marker != marker) {
        infowindow.setContent("");
        infowindow.marker = marker;
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener("closeclick",function() {
          infowindow.marker = null;
          marker.setAnimation(null);
        });
        getFoursqurePicture(marker);
      }
        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);
    }
  // Function for toggle the bounce animation for any marker that is clicked.
  function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
      marker.setAnimation(null);
    } else {
      // Check to see if any other markers are bouncing and remove bounce animation.
      for (i = 0; i < markers.length; i++) {
        if (markers[i].animating === true) {
          markers[i].setAnimation(null);
        }
      }
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
  }
};
