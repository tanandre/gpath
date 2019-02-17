var map, heatmap;
var progressDiv = document.getElementById('progressDiv');
var progressBar = document.getElementById('progress');
var progressText = document.getElementById('progressText');

function setProgressText(text) {
  progressText.innerHTML = text;
}

function updateProgress(oEvent) {
  if (oEvent.lengthComputable) {
    var percentComplete = Math.round(oEvent.loaded / oEvent.total * 100);
    percentComplete = percentComplete - percentComplete % 5;
    if (progressBar.value != percentComplete) {
      progressBar.value = percentComplete;
    }
  }
}

function readJson() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.addEventListener("progress", updateProgress);
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      setProgressText("Creating heatmap, please wait...");
      var data = JSON.parse(xmlhttp.responseText);
      displayHeatMap(data.locations);
      // schedule after main thread
      setTimeout(function() {
          progressDiv.style.display = "none";
      },0);
    }
  };
  xmlhttp.open("GET", "data/LocationHistory.json", true);
  xmlhttp.send();
}

function isInView(item) {
  var lat0 = map.getBounds().getNorthEast().lat();
  var lng0 = map.getBounds().getNorthEast().lng();
  var lat1 = map.getBounds().getSouthWest().lat();
  var lng1 = map.getBounds().getSouthWest().lng();

  var lat = item.latitudeE7 / 10000000;
  var lng = item.longitudeE7 / 10000000;
  if (lat < lat1 || lat > lat0) {
    return false;
  }
  if (lng > lng0 || lng < lng1) {
    return false;
  }

  return true;
}

function sanitizeData(locations) {
  var measurePerInterval = 1 * 60 * 1000;
  var previousTime = 0;
  var roundValueBy = 1000;
  var known = {};

  return locations.filter(function(item) {
    if (!isInView(item)) {
      return false;
    }
    var lat = Math.round(item.latitudeE7 / roundValueBy);
    var lon = Math.round(item.longitudeE7 / roundValueBy);
    var time = new Number(item.timestampMs);
    var timeDiff = Math.abs(time - previousTime);
    if (timeDiff < measurePerInterval) {
      return false;
    }
    previousTime = time;

    //console.log(lat, lon, new Date(time), previousTime - time);
    previousTime = time;

    var coord = lat + ',' + lon;
    if (known[coord] === undefined) {
      known[coord] = true;
      return true;
    }
    return false;
  });
}

var fnc = null;

function displayHeatMap(locations) {
  clearTimeout(fnc);
  fnc = setTimeout(function() {

    var filteredLocations = sanitizeData(locations);

    //console.log(filteredLocations.length);
    var hmd = filteredLocations.map(function(item) {
      var lat = (item.latitudeE7 / 10000000);
      var lon = (item.longitudeE7 / 10000000);
      //console.log(lat, lon);
      return {
        location: new google.maps.LatLng(lat, lon),
        weight: 1
      };
    });
    var heatmapData = hmd;

    //console.log(hmd.length);
    if (heatmap !== undefined) {
      heatmap.setMap(null)
    }

    heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapData
    });
    heatmap.setMap(map);

  }, 100);

}

function initMap() {
  var toronto = new google.maps.LatLng(43.6644, -79.3865);

  map = new google.maps.Map(document.getElementById('map'), {
    center: toronto,
    zoom: 14,
    mapTypeId: google.maps.MapTypeId.SATELLITE
  });
  // google.maps.event.addListenerOnce(map, 'idle', displayHeatMap);
  // google.maps.event.addListener(map, 'zoom_changed', displayHeatMap);
  // google.maps.event.addListener(map, 'center_changed', displayHeatMap);

}