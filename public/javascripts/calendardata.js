var data ={};
var marker_locate = [];
var place = {lat: 36.374077, lng: 127.365463};
var map;
var marker;


$(document).on('click',".save",function (e) {
    var start_picker = $('#datetimepicker1').data();
    var end_picker = $('#datetimepicker2').data();
    var start_date = start_picker.date ? new Date(start_picker.date) : null;
    var end_date = end_picker.date ? new Date(end_picker.date) : null;

    if(start_date&&end_date&&start_date.getTime() >= end_date.getTime()){
        alert("End time is faster than start time");
    }
    else {
        data['title'] = document.getElementById("title").value;
        data['start'] = new Date(start_picker.date).toISOString();
        data['end'] = new Date(end_picker.date).toISOString();
        data['Allday'] = $("#inlineCheckbox1").prop("checked");
        data['description'] = document.getElementById("description").value;
        data['place'] = marker_locate;
        data['id'] = $(this).data('id') || make_random_string(26);

        data['user_id'] = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getId();
        console.log(data);

        $.post('/event_save', data, function(result) {
            if (!result || result.err) {
                console.log(result.err);
            } else {
                console.log(result.result);
            }
        });
    }
})


function initialize() {
    var myOptions = {
        zoom: 15,
        center: new google.maps.LatLng(place.lat, place.lng)
    }
    map = new google.maps.Map(document.getElementById("marker"), myOptions);

    google.maps.event.addListener(map, 'click', function(event) {
        if(marker){
            deleteMarker();
        }
        var location = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
        };
        placeMarker(location);
    });
}

function placeMarker(location) {
    marker = new google.maps.Marker({
        position: location,
        map: map
    });
    map.setCenter(marker.getPosition());
    marker_locate = location;
}

function deleteMarker(){
    marker.setMap(null);
}

function make_random_string(num) {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < num; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}
