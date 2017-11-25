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
        data['start'] = start_picker.date;
        data['end'] = end_picker.date;
        data['Allday'] = $("#inlineCheckbox1").prop("checked");
        data['description'] = document.getElementById("description").value;
        data['place'] = marker_locate;
        data['id'] = new Date().getTime();
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

$(document).on('click',".remove",function (e) {

});

function initialize() {
    var myOptions = {
        zoom: 15,
        center: place,
    }
    map = new google.maps.Map(document.getElementById("marker"), myOptions);

    google.maps.event.addListener(map, 'click', function(event) {
        if(marker){
            deleteMarker();
        }
        placeMarker(event.latLng);
        marker_locate["latitude"] = event.latLng.lat();
        marker_locate["longitude"] = event.latLng.lng();
    });
}

function placeMarker(location) {
        marker = new google.maps.Marker({
            position: location,
            map: map
        });
}

function deleteMarker(){
    marker.setMap(null);
}
