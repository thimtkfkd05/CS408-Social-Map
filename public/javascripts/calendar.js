var selected;
var place;
var dropup = false;
var full_event = [
    {
        id : 1,
        title  : 'event1',
        start  : '2017-10-08',
        end  : '2017-10-08',
        allDay : true,
        place : {lat: -25.363, lng: 131.044}
    },
    {
        id : 2,
        title  : 'event2',
        start  : '2017-10-05',
        end    : '2017-10-11',
        place : {lat: 36.374077, lng: 127.365463}
    },
    {
        id : 3,
        title  : 'event3',
        start  : '2017-10-09T12:30:00',
        end  : '2017-10-09T16:30:00',
        allDay : false // will make the time show,
    }
];

$(document).ready(function() {

    $('#calendar').fullCalendar({
        header: {
            left: 'prev,today,next',
            center: 'title',
            right: 'month,agendaWeek,listDay'
        },
        events: full_event,
        dayClick: function(date, jsEvent, view) {
            selected && selected.removeClass("selected");
            selected = $(this);
            selected.addClass("selected");
            $('#calendar').fullCalendar('changeView', 'listDay', date);

        }
    });
$(document).on('click','.map-view', function () {
    var id = $(this).data('id');
        full_event.some(function (t) {
            if (t.id == id) {
                place = t.place;
                return true;
            } else {
                return false;
            }
        });

    });

    $('#mapModal').on('shown.bs.modal',function () {
        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 17,
            center: place
        });
        var marker = new google.maps.Marker({
            position: place,
            map: map
        });
        $('.loader').hide();
    }).on('hidden.bs.modal', function(){
        $('#map').empty();
        $('.loader').show();
    });
});


function btclick(){
    if(!$('.dropup').hasClass('open')){
        $('.dropup').find('.fa-plus').removeClass('fa-plus').addClass('fa-times');
    }
    else{
        $('.dropup').find('.fa-times').removeClass('fa-times').addClass('fa-plus');
    }
}

// function dropup_active(){
//     if(dropup == false){
//         $('.dropup-menu').show({
//             duration: 500
//         });
//         $('.menu i').removeClass('fa-plus').addClass('fa-times');
//         dropup = true;
//     }
//     else{
//         $('.dropup-menu').hide({
//             duration: 500
//         });
//         $('.menu i').addClass('fa-plus').removeClass('fa-times');
//         dropup = false;
//     }
// }
