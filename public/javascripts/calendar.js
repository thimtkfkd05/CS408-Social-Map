var selected;
var selected_event;
var full_event = [
    {
        id : 1,
        title  : 'event1',
        start  : '2017-10-08',
        end  : '2017-10-08',
        allDay : true,
        place : "hello world"
    },
    {
        id : 2,
        title  : 'event2',
        start  : '2017-10-05',
        end    : '2017-10-11'
    },
    {
        id : 3,
        title  : 'event3',
        start  : '2017-10-09T12:30:00',
        end  : '2017-10-09T16:30:00',
        allDay : false // will make the time show
    }
];

$(document).ready(function() {

    $('#calendar').fullCalendar({
        header: {
            left: 'prev,today,next',
            center: 'title',
            right: 'month,agendaWeek,agendaDay,listDay'
        },
        events: full_event,
        dayClick: function(date, jsEvent, view) {
            selected && selected.removeClass("selected");
            selected = $(this);
            selected.addClass("selected");
            $('#calendar').fullCalendar('changeView', 'listDay', date);

        }
    });

    $(document).on('click','.map-view',function () {
       // $(this).data-id
    });

});
